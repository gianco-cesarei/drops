import os
import tempfile
import threading
import time
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

from argon2 import PasswordHasher
from fastapi.testclient import TestClient

import bpm_jobs
import spotify_agent
import discogs_agent
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
        self.resolve_patch = patch("web_app.resolve_track", return_value={"title": None, "artist": None, "raw_title": None, "cover_url": None, "duration": None})
        self.resolve_patch.start()
        self.app = create_app(self.settings)
        self.client_context = TestClient(self.app)
        self.client = self.client_context.__enter__()

    def tearDown(self):
        self.client_context.__exit__(None, None, None)
        self.resolve_patch.stop()
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

    def test_auth_me_slides_session_and_refreshes_cookie(self):
        self.login()
        token = self.client.cookies.get(COOKIE_NAME)
        time.sleep(1.1)  # itsdangerous timestamps have 1s resolution
        response = self.client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 200)
        self.assertIn("set-cookie", response.headers)
        # The signed token is reissued with a fresh timestamp on every
        # authenticated call, so it differs from the one just used.
        self.assertNotEqual(self.client.cookies.get(COOKIE_NAME), token)

    def test_auth_me_401_when_session_expired_logs_reason(self):
        # A signed token carries no server-side record to mutate, so expiry is
        # exercised for real: issue one with a 1s TTL and let it lapse. The
        # cookie is passed explicitly (bypassing the client jar's own Max-Age
        # bookkeeping) so the server actually receives - and rejects - a
        # signature that has aged past session_ttl_seconds, rather than the
        # client simply dropping an expired cookie before sending it.
        short_lived = replace(self.settings, session_ttl_seconds=1)
        app = create_app(short_lived)
        with TestClient(app) as client:
            response = client.post("/api/v1/auth/login", json={"username": "owner", "password": "correct horse"})
            self.assertEqual(response.status_code, 200)
            token = response.cookies.get(COOKIE_NAME)
            time.sleep(2.2)  # itsdangerous timestamps truncate to whole seconds
            client.cookies.set(COOKIE_NAME, token)
            with self.assertLogs("drops.web", level="INFO") as captured:
                response = client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 401)
        self.assertTrue(any("cookie_expired" in message for message in captured.output))

    def test_auth_restart_without_store_keeps_session_valid(self):
        # Confirms the fix: a fresh WebStore (simulating Render wiping the
        # ephemeral /tmp on redeploy) must not invalidate an existing session,
        # since the signed cookie carries its own proof and needs no lookup.
        self.login()
        restarted_app = create_app(self.settings)
        with TestClient(restarted_app, cookies=self.client.cookies) as client:
            self.assertEqual(client.get("/api/v1/auth/me").json(), {"username": "owner"})

    def test_auth_me_401_with_tampered_cookie(self):
        self.login()
        token = self.client.cookies.get(COOKIE_NAME)
        self.client.cookies.set(COOKIE_NAME, token[:-1] + ("A" if token[-1] != "A" else "B"))
        with self.assertLogs("drops.web", level="INFO") as captured:
            response = self.client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 401)
        self.assertTrue(any("cookie_invalid" in message for message in captured.output))

    def test_auth_me_401_with_bogus_cookie_logs_reason(self):
        self.client.cookies.set(COOKIE_NAME, "not-a-real-token")
        with self.assertLogs("drops.web", level="INFO") as captured:
            response = self.client.get("/api/v1/auth/me")
        self.assertEqual(response.status_code, 401)
        self.assertTrue(any("cookie_invalid" in message for message in captured.output))

    def test_health_is_public_and_minimal(self):
        self.assertEqual(self.client.get("/health").json(), {"status": "ok"})

    def test_web_app_imports_internal_spotify_module(self):
        self.assertIs(web_app.WebSpotifyClient, spotify_agent.WebSpotifyClient)
        self.assertIs(web_app.DiscogsClient, discogs_agent.DiscogsClient)

    def test_spotify_routes_require_login(self):
        paths = [
            "/api/v1/spotify/status", "/api/v1/spotify/connect",
            "/api/v1/spotify/liked", "/api/v1/spotify/playlists",
            "/api/v1/spotify/playlists/example/tracks",
            "/api/v1/spotify/callback?code=x&state=y",
        ]
        for path in paths:
            self.assertEqual(self.client.get(path, follow_redirects=False).status_code, 401, path)
        self.assertEqual(self.client.post("/api/v1/discogs/enrich", json={"artist": "A", "title": "B"}).status_code, 401)
        self.assertEqual(self.client.post("/api/v1/bpm/compute", json={"artist": "A", "title": "B"}).status_code, 401)
        self.assertEqual(self.client.get("/api/v1/bpm/job/nope").status_code, 401)

    def test_bpm_compute_returns_async_job_and_poll_is_private(self):
        self.login()
        with patch("web_app.BpmJobManager.submit", return_value={"job_id": "job-1", "status": "queued"}) as submit, patch("web_app.BpmJobManager.get", return_value={"id": "job-1", "status": "ready", "bpm": 128, "confidence": 0.9}):
            response = self.client.post("/api/v1/bpm/compute", json={"track_key": "spotify:1", "artist": "Artist", "title": "Track", "source_url": "https://soundcloud.com/search?q=x"})
            self.assertEqual(response.status_code, 202)
            self.assertEqual(response.json()["job_id"], "job-1")
            self.assertEqual(self.client.get("/api/v1/bpm/job/job-1").json()["bpm"], 128)
            submit.assert_called_once()

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

    def test_discogs_enrich_route_is_authenticated_and_best_effort(self):
        self.login()
        result = {"label": "Night Label", "year": 2024, "country": "Portugal", "styles": ["House"], "artists": ["Artist"], "discogs_url": "https://discogs.test/release/1"}
        with patch("web_app.DiscogsClient.enrich", return_value=result) as enrich:
            response = self.client.post("/api/v1/discogs/enrich", json={"artist": "Artist", "title": "Track", "isrc": None})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), result)
        enrich.assert_called_once_with("Artist", "Track", None, None, None)

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

    def test_worker_log_carries_detail_but_api_error_stays_generic(self):
        # The generic-exception log line includes str(exc) for server-side
        # diagnosis (e.g. why an OSError happened) - that detail is only ever
        # written to the server log, never returned by the API.
        self.login()
        secret = "https://youtu.be/test?token=secret-token"
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": secret})
        worker, job_id, url, quality = submit.call_args.args
        with patch("web_app.yt_dlp.YoutubeDL", side_effect=RuntimeError(f"{secret} /private/secret ffmpeg --password token")):
            with self.assertLogs("drops.web", level="ERROR") as logs:
                worker(job_id, url, quality)
        log_text = " ".join(logs.output)
        self.assertIn("secret-token", log_text)
        job = self.client.get(f"/api/v1/downloads/{job_id}")
        self.assertEqual(job.json()["error"], "Download failed")

    def test_download_worker_propagates_real_downloaderror_message_sanitized(self):
        # Render's datacenter IPs trip YouTube's bot-check; the UI needs the
        # real reason, not a generic "Download failed" that hides it.
        self.login()
        url = "https://youtu.be/test?token=secret-token"
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": url})
        worker, job_id, worker_url, quality = submit.call_args.args
        bot_check = f"ERROR: {url}: Sign in to confirm you're not a bot. Use --cookies for the authentication."
        with patch("web_app.yt_dlp.YoutubeDL", side_effect=web_app.yt_dlp.utils.DownloadError(bot_check)), patch("web_app.time.sleep"):
            worker(job_id, worker_url, quality)
        job = self.client.get(f"/api/v1/downloads/{job_id}")
        error = job.json()["error"]
        self.assertIn("Sign in to confirm you're not a bot", error)
        self.assertNotIn("secret-token", error)
        self.assertIn("[url]", error)

    def test_download_worker_unexpected_error_stays_generic(self):
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test"})
        worker, job_id, url, quality = submit.call_args.args
        with patch("web_app.yt_dlp.YoutubeDL", side_effect=RuntimeError("boom")):
            worker(job_id, url, quality)
        job = self.client.get(f"/api/v1/downloads/{job_id}")
        self.assertEqual(job.json()["error"], "Download failed")

    def test_download_passes_cookiefile_when_configured(self):
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test"})
        worker, job_id, url, quality = submit.call_args.args
        with tempfile.TemporaryDirectory() as cookie_dir:
            cookies = Path(cookie_dir) / "cookies.txt"
            cookies.write_text("# Netscape HTTP Cookie File\n")
            seen_options = []

            class FakeYoutubeDL:
                def __init__(self, options):
                    seen_options.append(options)

                def __enter__(self):
                    return self

                def __exit__(self, *exc):
                    return False

                def extract_info(self, source, download=True):
                    raise web_app.yt_dlp.utils.DownloadError("stop after capturing options")

            with patch.dict(os.environ, {"DROPS_YTDLP_COOKIES": str(cookies)}), patch("web_app.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("web_app.time.sleep"):
                worker(job_id, url, quality)
        self.assertTrue(seen_options)
        self.assertEqual(seen_options[0]["cookiefile"], str(cookies))

    def test_download_omits_cookiefile_when_not_configured(self):
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test"})
        worker, job_id, url, quality = submit.call_args.args
        seen_options = []

        class FakeYoutubeDL:
            def __init__(self, options):
                seen_options.append(options)

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def extract_info(self, source, download=True):
                raise web_app.yt_dlp.utils.DownloadError("stop after capturing options")

        with patch.dict(os.environ, {}, clear=True), patch("web_app.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("web_app.time.sleep"):
            worker(job_id, url, quality)
        self.assertTrue(seen_options)
        self.assertNotIn("cookiefile", seen_options[0])

    def test_download_options_include_player_client_fallback(self):
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test"})
        worker, job_id, url, quality = submit.call_args.args
        seen_options = []

        class FakeYoutubeDL:
            def __init__(self, options):
                seen_options.append(options)

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def extract_info(self, source, download=True):
                raise web_app.yt_dlp.utils.DownloadError("stop after capturing options")

        with patch("web_app.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("web_app.time.sleep"):
            worker(job_id, url, quality)
        self.assertTrue(seen_options)
        self.assertEqual(seen_options[0]["extractor_args"]["youtube"]["player_client"], ["tv", "ios", "android", "web"])

    def test_download_retries_downloaderror_then_succeeds(self):
        # YouTube's bot-check is intermittent; a later attempt can succeed
        # without ever needing cookies.
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test"})
        worker, job_id, url, quality = submit.call_args.args
        attempts = []

        class FakeYoutubeDL:
            def __init__(self, options):
                self.options = options

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def extract_info(self, source, download=True):
                attempts.append(1)
                if len(attempts) < 3:
                    raise web_app.yt_dlp.utils.DownloadError("Sign in to confirm you're not a bot")
                job_dir = self.options["outtmpl"].rsplit("/", 1)[0]
                Path(job_dir, "audio.mp3").write_bytes(b"fake-audio")
                return {"title": "Track", "duration": 10}

        with patch("web_app.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("web_app.time.sleep"):
            worker(job_id, url, quality)
        self.assertEqual(len(attempts), 3)
        job = self.client.get(f"/api/v1/downloads/{job_id}")
        self.assertEqual(job.json()["status"], "ready")

    def test_download_does_not_retry_own_size_limit_abort(self):
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test"})
        worker, job_id, url, quality = submit.call_args.args
        attempts = []

        class FakeYoutubeDL:
            def __init__(self, options):
                pass

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def extract_info(self, source, download=True):
                attempts.append(1)
                raise web_app.yt_dlp.utils.DownloadError("Download size limit exceeded")

        with patch("web_app.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("web_app.time.sleep") as sleep:
            worker(job_id, url, quality)
        self.assertEqual(len(attempts), 1)
        sleep.assert_not_called()
        job = self.client.get(f"/api/v1/downloads/{job_id}")
        self.assertEqual(job.json()["error"], "Download size limit exceeded")

    def test_start_download_returns_recognized_job_instantly(self):
        self.login()
        self.resolve_patch.stop()
        try:
            with patch("web_app.resolve_track", return_value={
                "title": "Baby", "artist": "Four Tet", "raw_title": "Four Tet - Baby (Official Video)",
                "cover_url": "https://i.ytimg.com/vi/x/hq.jpg", "duration": 245,
            }), patch.object(self.app.state.executor, "submit") as submit:
                response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/x", "quality": "320"})
        finally:
            self.resolve_patch.start()
        self.assertEqual(response.status_code, 202)
        body = response.json()
        self.assertEqual(body["status"], "recognized")
        self.assertEqual(body["title"], "Baby")
        self.assertEqual(body["artist"], "Four Tet")
        self.assertEqual(body["cover_url"], "https://i.ytimg.com/vi/x/hq.jpg")
        self.assertEqual(body["duration"], 245)
        submit.assert_called_once()

    def test_process_job_tries_soundcloud_before_native_and_records_source(self):
        self.login()
        self.resolve_patch.stop()
        try:
            with patch("web_app.resolve_track", return_value={
                "title": "Baby", "artist": "Four Tet", "raw_title": "Four Tet - Baby",
                "cover_url": None, "duration": 245,
            }), patch.object(self.app.state.executor, "submit") as submit:
                response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/native"})
        finally:
            self.resolve_patch.start()
        worker, job_id, url, quality = submit.call_args.args

        # download_multi_source is mocked, so process_job's own job_dir.mkdir()
        # is the only mkdir - the fake writes its artifact into that same dir
        # (job_dir is download_multi_source's first positional argument).
        def fake_multi_source(job_dir, *args, **kwargs):
            Path(job_dir, "Baby.mp3").write_bytes(b"fake-audio")
            return {"title": "Baby", "duration": 245}, "soundcloud"

        with patch("web_app.download_multi_source", side_effect=fake_multi_source), \
             patch("web_app.analyze_bpm", return_value={"bpm": 122.0, "bpm_confidence": 0.8}):
            worker(job_id, url, quality)

        job = self.client.get(f"/api/v1/downloads/{job_id}")
        payload = job.json()
        self.assertEqual(payload["status"], "ready")
        self.assertEqual(payload["source"], "soundcloud")
        self.assertEqual(payload["bpm"], 122.0)

    def test_process_job_runs_discogs_enrichment_when_metadata_present(self):
        self.login()
        self.resolve_patch.stop()
        try:
            with patch("web_app.resolve_track", return_value={
                "title": "Baby", "artist": "Four Tet", "raw_title": "Four Tet - Baby",
                "cover_url": None, "duration": 245,
            }), patch.object(self.app.state.executor, "submit") as submit:
                response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/native"})
        finally:
            self.resolve_patch.start()
        worker, job_id, url, quality = submit.call_args.args

        with patch.object(self.app.state.discogs, "enrich", return_value={
            "label": "Text Records", "year": 2020, "country": "UK", "catalog_no": "TEXT001",
            "styles": ["Electronic"], "discogs_url": "https://discogs.com/release/1", "cover_url": None,
        }) as enrich, patch("web_app.download_multi_source", side_effect=RuntimeError("stop after enrichment")):
            worker(job_id, url, quality)
        enrich.assert_called_once_with("Four Tet", "Baby")

        job = self.client.get(f"/api/v1/downloads/{job_id}")
        payload = job.json()
        self.assertEqual(payload["label"], "Text Records")
        self.assertEqual(payload["year"], 2020)
        self.assertEqual(payload["style"], ["Electronic"])
        self.assertEqual(payload["status"], "error")

    def test_process_job_skips_discogs_when_metadata_missing(self):
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/native"})
        worker, job_id, url, quality = submit.call_args.args
        with patch.object(self.app.state.discogs, "enrich") as enrich, patch("web_app.yt_dlp.YoutubeDL", side_effect=RuntimeError("boom")):
            worker(job_id, url, quality)
        enrich.assert_not_called()

    def test_download_and_bpm_serialize_through_shared_ytdlp_lock(self):
        # Concurrent yt-dlp calls from the same process/IP add up to more
        # "bot-like" traffic; the download worker and BPM engine must never
        # run yt-dlp at the same instant - one waits for the other, not fails.
        self.login()
        with patch.object(self.app.state.executor, "submit") as submit:
            response = self.client.post("/api/v1/downloads", json={"url": "https://youtu.be/test"})
        worker, job_id, url, quality = submit.call_args.args

        events: list[tuple[str, float]] = []
        events_lock = threading.Lock()

        def record(label: str) -> None:
            with events_lock:
                events.append((label, time.monotonic()))

        bpm_manager = bpm_jobs.BpmJobManager(Path(self.temp.name) / "lock-bpm-state")
        bpm_dir = Path(self.temp.name) / "lock-bpm-work"
        bpm_dir.mkdir()

        # web_app.py and bpm_jobs.py both `import yt_dlp`, so they share the
        # same module object - patching YoutubeDL via either module path
        # patches the same underlying attribute. One fake dispatching on the
        # options shape (only the download worker sets "postprocessors").
        class SharedFakeYoutubeDL:
            def __init__(self, options):
                self.options = options

            def __enter__(self):
                return self

            def __exit__(self, *exc):
                return False

            def extract_info(self, source, download=True):
                label = "download" if "postprocessors" in self.options else "bpm"
                record(f"{label}-start")
                time.sleep(0.15)
                record(f"{label}-end")
                out_dir = self.options["outtmpl"].rsplit("/", 1)[0]
                Path(out_dir, "audio.mp3").write_bytes(b"fake-audio")
                return {"title": "Track", "duration": 10} if label == "download" else None

        with (
            patch("web_app.yt_dlp.YoutubeDL", SharedFakeYoutubeDL),
            patch("bpm_jobs.analyze_bpm", return_value={"bpm": 120.0, "bpm_confidence": 0.9}),
        ):
            download_thread = threading.Thread(target=worker, args=(job_id, url, quality))
            bpm_thread = threading.Thread(target=bpm_manager._compute, args=(bpm_dir, "Artist", "Title", None, None))
            download_thread.start()
            bpm_thread.start()
            download_thread.join()
            bpm_thread.join()

        self.assertEqual(len(events), 4)
        ordered = sorted(events, key=lambda item: item[1])
        suffixes = [label.split("-")[1] for label, _ in ordered]
        self.assertEqual(suffixes, ["start", "end", "start", "end"])
        # the two "start"/"end" pairs must belong to different jobs (real overlap-free interleave)
        self.assertNotEqual(ordered[0][0].split("-")[0], ordered[2][0].split("-")[0])


class WebStoreJobLifecycleTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = web_app.WebStore(Path(self.temp.name) / "store.sqlite3")

    def tearDown(self):
        self.temp.cleanup()

    def test_create_job_if_capacity_inserts_recognized_with_metadata(self):
        accepted = self.store.create_job_if_capacity(
            "job-1", "owner", "https://youtu.be/x", "audio", "320", 600, 10,
            title="Baby", artist="Four Tet", cover_url="https://x/cover.jpg",
            raw_title="Four Tet - Baby (Official Video)", duration=245,
        )
        self.assertTrue(accepted)
        row = self.store.get_job("job-1", "owner")
        self.assertEqual(row["status"], "recognized")
        self.assertEqual(row["title"], "Baby")
        self.assertEqual(row["artist"], "Four Tet")
        self.assertEqual(row["cover_url"], "https://x/cover.jpg")
        self.assertEqual(row["raw_title"], "Four Tet - Baby (Official Video)")
        self.assertEqual(row["duration"], 245)

    def test_capacity_counts_recognized_enriching_downloading_not_ready_or_error(self):
        self.store.create_job_if_capacity("a", "owner", "u", "audio", "320", 600, 1)
        self.assertFalse(self.store.create_job_if_capacity("b", "owner", "u", "audio", "320", 600, 1))
        self.store.update_job("a", status="ready")
        self.assertTrue(self.store.create_job_if_capacity("c", "owner", "u", "audio", "320", 600, 1))
        self.store.update_job("c", status="enriching")
        self.assertFalse(self.store.create_job_if_capacity("d", "owner", "u", "audio", "320", 600, 1))

    def test_get_job_by_id_ignores_owner(self):
        self.store.create_job_if_capacity("job-2", "owner-a", "u", "audio", "320", 600, 10, artist="X", title="Y")
        row = self.store.get_job_by_id("job-2")
        self.assertEqual(row["owner"], "owner-a")
        self.assertEqual(row["artist"], "X")
        self.assertIsNone(self.store.get_job_by_id("missing"))

    def test_new_metadata_columns_default_to_null(self):
        self.store.create_job_if_capacity("job-3", "owner", "u", "audio", "320", 600, 10)
        row = self.store.get_job("job-3", "owner")
        for column in ("artist", "cover_url", "raw_title", "duration", "label", "year", "country", "catalog_no", "style", "discogs_url", "bpm", "bpm_confidence", "source"):
            self.assertIsNone(row[column])


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
            "DROPS_WEB_SESSION_SECRET": "test-secret",
        }
        with patch.dict(os.environ, env, clear=True):
            settings = WebSettings.from_env()
        self.assertEqual(settings.allowed_origins, ("https://drops.example", "http://localhost:3000"))


if __name__ == "__main__":
    unittest.main()
