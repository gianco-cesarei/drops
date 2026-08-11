import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import spotify_agent


class SpotifyAgentTest(unittest.TestCase):
    def test_default_client_id_is_packaged_public_value(self):
        with patch.dict(spotify_agent.os.environ, {}, clear=True):
            self.assertEqual(
                spotify_agent._client_id(), spotify_agent.DEFAULT_SPOTIFY_CLIENT_ID
            )

    def test_allowlist_error_requests_reconnect(self):
        message, reconnect = spotify_agent.explain_connection_error(
            spotify_agent.SpotifyAgentError(
                'Spotify HTTP 403: {"error": "user is not registered"}'
            )
        )
        self.assertTrue(reconnect)
        self.assertIn("User Management", message)

    def test_connection_status_never_returns_tokens(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            token_file = Path(temp_dir) / "token.json"
            account_file = Path(temp_dir) / "account.json"
            token_file.write_text(
                json.dumps(
                    {
                        "access_token": "secret-access",
                        "refresh_token": "secret-refresh",
                        "expires_at": 9999999999,
                        "scope": "user-library-read",
                    }
                )
            )
            profile = {"id": "abc", "display_name": "Giancarlo"}
            with (
                patch.object(spotify_agent, "TOKEN_FILE", token_file),
                patch.object(spotify_agent, "ACCOUNT_FILE", account_file),
                patch.object(spotify_agent, "_spotify_get", return_value=profile),
            ):
                status = spotify_agent.connection_status()

            serialized = json.dumps(status)
            self.assertTrue(status["connected"])
            self.assertEqual(status["account"]["id"], "abc")
            self.assertNotIn("secret-access", serialized)
            self.assertNotIn("secret-refresh", serialized)

    def test_export_saved_tracks_writes_metadata_only(self):
        page = {
            "items": [
                {
                    "added_at": "2026-08-11T12:00:00Z",
                    "track": {
                        "id": "track-1",
                        "name": "Titolo",
                        "artists": [{"name": "Artista"}],
                        "album": {"name": "Album", "release_date": "2026"},
                        "duration_ms": 123000,
                        "external_urls": {"spotify": "https://open.spotify.com/track/1"},
                    },
                }
            ],
            "next": None,
        }
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.object(spotify_agent, "_spotify_get", return_value=page):
                result = spotify_agent.export_saved_tracks(Path(temp_dir))
            exported = json.loads(Path(result["path"]).read_text())

        self.assertEqual(result["total"], 1)
        self.assertEqual(exported["tracks"][0]["artists"], ["Artista"])
        self.assertNotIn("audio", exported["tracks"][0])


if __name__ == "__main__":
    unittest.main()
