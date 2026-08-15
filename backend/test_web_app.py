import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from argon2 import PasswordHasher
from fastapi.testclient import TestClient

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
        )
        self.app = create_app(self.settings)
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.state.executor.shutdown(wait=True, cancel_futures=True)
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

    def test_cors_uses_exact_allowlist(self):
        allowed = self.client.options("/api/v1/auth/me", headers={"Origin": "https://drops.example", "Access-Control-Request-Method": "GET"})
        denied = self.client.options("/api/v1/auth/me", headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"})
        self.assertEqual(allowed.headers.get("access-control-allow-origin"), "https://drops.example")
        self.assertIsNone(denied.headers.get("access-control-allow-origin"))

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


if __name__ == "__main__":
    unittest.main()
