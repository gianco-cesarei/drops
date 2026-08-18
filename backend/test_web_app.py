import os
import tempfile
import threading
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from argon2 import PasswordHasher
from fastapi.testclient import TestClient

import spotify_agent
import web_app
from web_app import COOKIE_NAME, create_app
from web_settings import WebSettings


class WebAppTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.settings = WebSettings(
            username="owner",
            password_hash=PasswordHasher().hash("correct horse"),
            state_dir=Path(self.temp.name),
            allowed_origins=("https://drops.example",),
            cookie_secure=False,
            session_ttl_seconds=3600,
            artifact_ttl_seconds=600,
            max_queued=2,
            max_concurrent=1,
            max_duration_seconds=300,
            max_file_bytes=1_000_000,
            login_rate_limit=3,
            login_rate_window_seconds=60,
            environment="test",
            allow_missing_origin=True,
        )
        self.app = create_app(self.settings)
        self.client_context = TestClient(self.app)
        self.client = self.client_context.__enter__()

    def tearDown(self):
        self.client_context.__exit__(None, None, None)
        self.temp.cleanup()

    def login(self):
        response = self.client.post("/api/v1/auth/login", json={"username": "owner", "password": "correct horse"})
        self.assertEqual(response.status_code, 200)
        return response

    def test_auth_login_me_logout_and_cookie_policy(self):
        self.assertEqual(self.client.get("/api/v1/auth/me").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/auth/login", json={"username": "owner", "password": "wrong"}).status_code, 401)
        response = self.login()
        cookie = response.headers["set-cookie"]
        self.assertIn("HttpOnly", cookie)
        self.assertIn("SameSite=lax", cookie)
        self.assertEqual(self.client.get("/api/v1/auth/me").json(), {"username": "owner"})
        self.assertEqual(self.client.post("/api/v1/auth/logout").status_code, 204)
        self.assertEqual(self.client.get("/api/v1/auth/me").status_code, 401)

    def test_health_is_public_and_minimal(self):
        self.assertEqual(self.client.get("/health").json(), {"status": "ok"})

    def test_web_app_imports_internal_spotify_module(self):
        self.assertIs(web_app.WebSpotifyClient, spotify_agent.WebSpotifyClient)

    def test_spotify_routes_require_login(self):
        paths = [
            "/api/v1/spotify/status", "/api/v1/spotify/connect",
            "/api/v1/spotify/liked", "/api/v1/spotify/playlists",
            "/api/v1/spotify/playlists/example/tracks",
            "/api/v1/spotify/callback?code=x&state=y",
        ]
        for path in paths:
            self.assertEqual(self.client.get(path, follow_redirects=False).status_code, 401, path)

    def test_spotify_web_routes_return_safe_shapes_and_redirects(self):
        self.login()
        with (
            patch("spotify_agent.WebSpotifyClient.status", return_value={"connected": True, "display_name": "Gianco"}),
            patch("spotify_agent.WebSpotifyClient.create_authorization", return_value="https://accounts.spotify.com/authorize?state=safe"),
            patch("spotify_agent.WebSpotifyClient.exchange_code", return_value={"display_name": "Gianco"}),
            patch("spotify_agent.WebSpotifyClient.liked", return_value={"total": 0, "limit": 50, "offset": 0, "tracks": []}),
            patch("spotify_agent.WebSpotifyClient.playlists", return_value={"playlists": []}),
            patch("spotify_agent.WebSpotifyClient.playlist_tracks", return_value={"total": 0, "tracks": []}),
        ):
            self.assertEqual(self.client.get("/api/v1/spotify/status").json(), {"connected": True, "display_name": "Gianco"})
            self.assertEqual(self.client.get("/api/v1/spotify/connect", follow_redirects=False).headers["location"], "https://accounts.spotify.com/authorize?state=safe")
            self.assertEqual(self.client.get("/api/v1/spotify/callback?code=x&state=y", follow_redirects=False).headers["location"], "/app/spotify")
            self.assertEqual(self.client.get("/api/v1/spotify/liked").json()["tracks"], [])
            self.assertEqual(self.client.get("/api/v1/spotify/playlists").json(), {"playlists": []})
            self.assertEqual(self.client.get("/api/v1/spotify/playlists/example/tracks").json()["tracks"], [])

    def test_login_rate_limit_is_configurable(self):
        app = create_app(replace(self.settings, state_dir=Path(self.temp.name) / "rate", login_rate_limit=2))
        with TestClient(app) as client:
            body = {"username": "owner", "password": "wrong"}
            self.assertEqual(client.post("/api/v1/auth/login", json=body).status_code, 401)
            self.assertEqual(client.post("/api/v1/auth/login", json=body).status_code, 401)
            self.assertEqual(client.post("/api/v1/auth/login", json=body).status_code, 429)

    def test_cors_uses_exact_allowlist(self):
        allowed = self.client.options("/api/v1/auth/me", headers={"Origin": "https://drops.example", "Access-Control-Request-Method": "GET"})
        denied = self.client.options("/api/v1/auth/me", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
        self.assertEqual(allowed.headers.get("access-control-allow-origin"), "https://drops.example")
        self.assertIsNone(denied.headers.get("access-control-allow-origin"))

    def test_csrf_origin_validation_and_explicit_missing_origin_policy(self):
        strict_app = create_app(replace(self.settings, state_dir=Path(self.temp.name) / "csrf", allow_missing_origin=False))
        with TestClient(strict_app) as client:
            login = client.post("/api/v1/auth/login", json={"username": "owner", "password": "correct horse"})
            self.assertEqual(login.status_code, 200)
            body = {"url": "https://youtu.be/test", "quality": "320"}
            self.assertEqual(client.post("/api/v1/downloads", json=body).status_code, 403)
            self.assertEqual(client.post("/api/v1/downloads", json=body, headers={"Origin": "https://evil.example"}).status_code, 403)
            with patch.object(strict_app.state.executor, "submit"):
                self.assertEqual(client.post("/api/v1/downloads", json=body, headers={"Origin": "https://drops.example"}).status_code, 202)
            self.assertEqual(client.post("/api/v1/auth/logout", headers={"Origin": "https://evil.example"}).status_code, 403)
            self.assertEqual(client.post("/api/v1/auth/logout", headers={"Origin": "https://drops.example"}).status_code, 204)

        self.login()
        with patch.object(self.app.state.executor, "submit"):
            self.assertEqual(self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/local"}).status_code, 202)

    def test_unknown_job_and_path_traversal_are_not_found(self):
        self.login()
        self.assertEqual(self.client.get("/api/v1/downloads/unknown").status_code, 404)
        self.assertEqual(self.client.get("/api/v1/downloads/%2e%2e%2fsecret/file").status_code, 404)

        self.app.state.store.create_job("other-job", "other-owner", "https://youtu.be/test", "audio", "320", 600)
        self.assertEqual(self.client.get("/api/v1/downloads/other-job").status_code, 404)

    def test_file_requires_auth_and_stays_inside_job_directory(self):
        self.login()
        store = self.app.state.store
        job_id = "11111111-1111-1111-1111-111111111111"
        job_dir = self.settings.state_dir / "jobs" / job_id
        job_dir.mkdir(parents=True)
        artifact = job_dir / "safe.mp3"
        artifact.write_bytes(b"audio")
        store.create_job(job_id, "owner", "https://youtu.be/test", "audio", "320", 600)
        store.update_job(job_id, status="ready", filename="safe.mp3", file_path=str(artifact), size=5)
        self.client.cookies.clear()
        self.assertEqual(self.client.get(f"/api/v1/downloads/{job_id}/file").status_code, 401)
        self.login()
        response = self.client.get(f"/api/v1/downloads/{job_id}/file")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b"audio")

        outside = self.settings.state_dir / "outside.mp3"
        outside.write_bytes(b"private")
        store.update_job(job_id, file_path=str(outside))
        self.assertEqual(self.client.get(f"/api/v1/downloads/{job_id}/file").status_code, 404)

    def test_create_download_returns_no_absolute_path(self):
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test", "quality": "320"})
        self.assertEqual(response.status_code, 202)
        self.assertNotIn(self.temp.name, response.text)
        submit.assert_called_once()

    def test_cleanup_derives_safe_job_directory_instead_of_file_path(self):
        self.login()
        victim = self.settings.state_dir / "victim"
        victim.mkdir()
        (victim / "keep.txt").write_text("keep")
        store = self.app.state.store
        store.create_job("../victim", "owner", "https://youtu.be/test", "audio", "320", 600)
        store.update_job("../victim", file_path=str(victim / "keep.txt"), expires_at=0)
        with self.assertLogs("drops.web", level="ERROR") as logs:
            self.client.get("/api/v1/auth/me")
        self.assertTrue((victim / "keep.txt").exists())
        self.assertIn("refused unsafe cleanup", " ".join(logs.output))

    def test_startup_interrupts_previous_active_jobs_and_lifespan_closes_executor(self):
        app = create_app(replace(self.settings, state_dir=Path(self.temp.name) / "restart"))
        app.state.store.create_job("stale", "owner", "https://youtu.be/test", "audio", "320", 600)
        expired_dir = self.settings.state_dir / "restart" / "jobs" / "expired"
        expired_dir.mkdir(parents=True)
        artifact = expired_dir / "old.mp3"
        artifact.write_bytes(b"old")
        app.state.store.create_job("expired", "owner", "https://youtu.be/test", "audio", "320", 600)
        app.state.store.update_job("expired", status="ready", file_path=str(artifact), expires_at=0)
        with TestClient(app):
            row = app.state.store.get_job("stale", "owner")
            self.assertEqual(row["status"], "error")
            self.assertEqual(row["error"], "Download interrupted")
            self.assertFalse(expired_dir.exists())
        self.assertTrue(app.state.executor._shutdown)

    def test_capacity_check_and_job_insert_are_atomic(self):
        store = self.app.state.store
        barrier = threading.Barrier(3)
        results = []

        def reserve(job_id):
            barrier.wait()
            results.append(store.create_job_if_capacity(job_id, "owner", "https://youtu.be/test", "audio", "320", 600, 1))

        workers = [threading.Thread(target=reserve, args=(f"atomic-{index}",)) for index in range(2)]
        for worker in workers:
            worker.start()
        barrier.wait()
        for worker in workers:
            worker.join()
        self.assertEqual(sorted(results), [False, True])

    def test_worker_log_and_api_error_do_not_expose_sensitive_details(self):
        self.login()
        secret = "https://youtu.be/test?token=secret-token"
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": secret})
        worker, job_id, url, quality = submit.call_args.args
        with patch("web_app.yt_dlp.YoutubeDL", side_effect=RuntimeError(f"{secret} /private/secret ffmpeg --password token")):
            with self.assertLogs("drops.web", level="ERROR") as logs:
                worker(job_id, url, quality)
        log_text = " ".join(logs.output)
        self.assertNotIn("secret-token", log_text)
        self.assertNotIn("/private/secret", log_text)
        self.assertNotIn("ffmpeg", log_text)
        job = self.client.get(f"/api/v1/downloads/{job_id}")
        self.assertEqual(job.json()["error"], "Download failed")


class WebSettingsTest(unittest.TestCase):
    def test_documentation_has_reproducible_python_312_test_command(self):
        documentation = (Path(__file__).parent / "WEB_BACKEND.md").read_text()
        self.assertIn("python3.12 -m venv .venv-web", documentation)
        self.assertIn("unittest discover -s backend", documentation)

    def test_rejects_invalid_wildcard_and_empty_production_origins(self):
        base = {
            "DROPS_WEB_USERNAME": "owner",
            "DROPS_WEB_PASSWORD_HASH": PasswordHasher().hash("password"),
            "DROPS_WEB_ENV": "production",
        }
        with patch.dict(os.environ, base, clear=True):
            with self.assertRaisesRegex(ValueError, "required in production"):
                WebSettings.from_env()
        with patch.dict(os.environ, {**base, "DROPS_WEB_ALLOWED_ORIGINS": "https://*.example.com"}, clear=True):
            with self.assertRaisesRegex(ValueError, "Invalid exact origin"):
                WebSettings.from_env()

    def test_accepts_exact_http_and_https_origins(self):
        env = {
            "DROPS_WEB_USERNAME": "owner",
            "DROPS_WEB_PASSWORD_HASH": PasswordHasher().hash("password"),
            "DROPS_WEB_ENV": "production",
            "DROPS_WEB_ALLOWED_ORIGINS": "https://drops.example,http://localhost:3000",
        }
        with patch.dict(os.environ, env, clear=True):
            settings = WebSettings.from_env()
        self.assertEqual(settings.allowed_origins, ("https://drops.example", "http://localhost:3000"))


if __name__ == "__main__":
    unittest.main()
