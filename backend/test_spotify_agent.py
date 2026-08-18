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

    def test_web_enrichment_matches_catalog_without_removed_spotify_batch_fields(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            catalog_dir = root / "catalog"
            catalog_dir.mkdir()
            (catalog_dir / "tracks.json").write_text(json.dumps({"tracks": [
                {"spotify_id": "spotify-match", "artist": "Wrong", "title": "Wrong", "bpm": 125},
                {"isrc": "ISRC-MATCH", "artist": "Other", "title": "Other", "bpm": 128},
                {"artist": "Àrtist Three", "title": "Track (Three)", "bpm": 131},
            ]}))
            client = spotify_agent.WebSpotifyClient(root, catalog_dir)
            items = []
            for index in range(21):
                track_id = "spotify-match" if index == 0 else f"track-{index}"
                isrc = "ISRC-MATCH" if index == 1 else None
                artist = "Artist Three" if index == 2 else f"Artist {index}"
                title = "Track Three" if index == 2 else f"Track {index}"
                items.append({"added_at": "2026-08-01T00:00:00Z", "track": {
                    "id": track_id, "name": title, "artists": [{"name": artist}],
                    "album": {"id": f"album-{index}", "name": f"Album {index}", "images": []},
                    "external_ids": {"isrc": isrc} if isrc else {}, "duration_ms": 1000,
                }})

            tracks = client.enrich(items)
            self.assertEqual([track["bpm"] for track in tracks[:3]], [125, 128, 131])
            self.assertTrue(all(track["in_catalog"] for track in tracks[:3]))
            self.assertIsNone(tracks[0]["label"])

    def test_web_enrichment_returns_tracks_when_isrc_and_label_missing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            client = spotify_agent.WebSpotifyClient(Path(temp_dir), Path(temp_dir) / "missing")
            item = {"added_at": "2026-08-01T00:00:00Z", "item": {
                "id": "track-missing-fields", "name": "No Metadata", "artists": [{"name": "Artist"}],
                "album": {"name": "Album", "images": []}, "duration_ms": 1000,
            }}
            result = client.enrich_best_effort([item])
            self.assertEqual(result[0]["id"], "track-missing-fields")
            self.assertIsNone(result[0]["isrc"])
            self.assertIsNone(result[0]["label"])
            self.assertIsNone(result[0]["bpm"])
            self.assertFalse(result[0]["in_catalog"])

    def test_web_enrichment_uses_discogs_label_when_spotify_label_missing(self):
        class FakeDiscogs:
            def enrich(self, artist, title, **kwargs):
                return {"label": "Discogs Label", "year": 2024, "country": "Portugal", "styles": ["House"], "discogs_url": "https://discogs.test/release/1"}

        with tempfile.TemporaryDirectory() as temp_dir:
            client = spotify_agent.WebSpotifyClient(Path(temp_dir), Path(temp_dir) / "missing", discogs=FakeDiscogs())
            result = client.enrich([{"added_at": None, "track": {"id": "discogs-track", "name": "Track", "artists": [{"name": "Artist"}], "album": {"name": "Album"}}}])
            self.assertEqual(result[0]["label"], "Discogs Label")
            self.assertEqual(result[0]["discogs_url"], "https://discogs.test/release/1")

    def test_web_liked_cycles_spotify_pages_over_fifty(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            client = spotify_agent.WebSpotifyClient(Path(temp_dir), Path(temp_dir) / "missing")
            pages = [
                {"total": 75, "items": [{"item": {"id": str(i), "artists": [], "album": {}}} for i in range(50)]},
                {"total": 75, "items": [{"item": {"id": str(i), "artists": [], "album": {}}} for i in range(50, 75)]},
            ]
            with patch.object(client, "get", side_effect=pages) as get, patch.object(client, "enrich", side_effect=lambda items: items):
                result = client.liked(75, 0)
            self.assertEqual(len(result["tracks"]), 75)
            self.assertEqual(get.call_count, 2)

    def test_web_playlist_uses_items_endpoint_and_handles_items_field(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            client = spotify_agent.WebSpotifyClient(Path(temp_dir), Path(temp_dir) / "missing")
            with patch.object(client, "get", return_value={
                "total": 1, "items": [{"item": {"id": "playlist-track", "name": "Track", "artists": [], "album": {}}}],
            }) as get:
                result = client.playlist_tracks("playlist-id")
            self.assertEqual(result["tracks"][0]["id"], "playlist-track")
            self.assertIn("/playlists/playlist-id/items?limit=50", get.call_args.args[0])


if __name__ == "__main__":
    unittest.main()
