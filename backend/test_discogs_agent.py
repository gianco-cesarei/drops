import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from discogs_agent import DiscogsAgentError, DiscogsClient


class DiscogsAgentTest(unittest.TestCase):
    def test_enrich_extracts_release_label_and_relationship_data(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"DISCOGS_TOKEN": "test-token"}):
                client = DiscogsClient(Path(temp_dir))
                with patch.object(client, "_get", side_effect=[
                    {"results": [{"id": 42}]},
                    {"id": 42, "uri": "/release/42", "labels": [{"name": "Night Label", "catno": "NL-01"}], "year": 2024, "country": "Portugal", "styles": ["House"], "genres": ["Electronic"], "artists": [{"name": "Artist"}]},
                ]):
                    result = client.enrich("Artist", "Track", isrc="PT-ISRC")
            self.assertEqual(result["label"], "Night Label")
            self.assertEqual(result["catalog_no"], "NL-01")
            self.assertEqual(result["styles"], ["Electronic", "House"])
            self.assertEqual(result["discogs_url"], "/release/42")
            brain = json.loads((Path(temp_dir) / "discogs-brain.json").read_text())
            self.assertEqual(brain["relations"][0]["source"], "discogs")

    def test_enrich_extracts_primary_cover_image(self):
        with patch.object(DiscogsClient, "_get") as get:
            get.side_effect = [
                {"results": [{"id": 42}]},
                {
                    "id": 42, "uri": "/release/42",
                    "labels": [{"name": "Night Label", "catno": "NL-01"}],
                    "year": 2024, "country": "Portugal", "styles": ["House"], "genres": [], "artists": [{"name": "Artist"}],
                    "images": [
                        {"type": "secondary", "uri": "https://img.discogs.com/secondary.jpg"},
                        {"type": "primary", "uri": "https://img.discogs.com/primary.jpg"},
                    ],
                },
            ]
            with tempfile.TemporaryDirectory() as state_dir:
                client = DiscogsClient(Path(state_dir))
                client.token = "token"
                result = client.enrich("Artist", "Title")
        self.assertEqual(result["cover_url"], "https://img.discogs.com/primary.jpg")

    def test_enrich_cover_falls_back_to_first_image_when_no_primary(self):
        with patch.object(DiscogsClient, "_get") as get:
            get.side_effect = [
                {"results": [{"id": 42}]},
                {
                    "id": 42, "labels": [{"name": "L"}], "artists": [],
                    "images": [{"type": "secondary", "uri": "https://img.discogs.com/only.jpg"}],
                },
            ]
            with tempfile.TemporaryDirectory() as state_dir:
                client = DiscogsClient(Path(state_dir))
                client.token = "token"
                result = client.enrich("Artist", "Title")
        self.assertEqual(result["cover_url"], "https://img.discogs.com/only.jpg")

    def test_enrich_cover_none_when_no_images(self):
        with patch.object(DiscogsClient, "_get") as get:
            get.side_effect = [{"results": [{"id": 42}]}, {"id": 42, "labels": [{"name": "L"}], "artists": []}]
            with tempfile.TemporaryDirectory() as state_dir:
                client = DiscogsClient(Path(state_dir))
                client.token = "token"
                result = client.enrich("Artist", "Title")
        self.assertIsNone(result["cover_url"])

    def test_cache_avoids_second_discogs_request(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"DISCOGS_TOKEN": "test-token"}):
                client = DiscogsClient(Path(temp_dir))
                payload = {"results": []}
                with patch("discogs_agent.urllib.request.urlopen") as urlopen:
                    response = urlopen.return_value.__enter__.return_value
                    response.read.return_value = json.dumps(payload).encode()
                    client._get("/database/search", {"artist": "A", "title": "B"})
                    client._get("/database/search", {"artist": "A", "title": "B"})
            self.assertEqual(urlopen.call_count, 1)

    def test_enrich_persists_label_for_disk_only_cached_lookup(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"DISCOGS_TOKEN": "test-token"}):
                client = DiscogsClient(Path(temp_dir))
                with patch.object(client, "_get", side_effect=[
                    {"results": [{"id": 42}]},
                    {"id": 42, "labels": [{"name": "Night Label"}], "artists": []},
                ]) as get:
                    client.enrich("Artist", "Track", isrc="PT-ISRC")
                # cached_label must not touch the network at all.
                cached = client.cached_label("Artist", "Track", isrc="PT-ISRC")
                self.assertEqual(cached["label"], "Night Label")
                self.assertEqual(get.call_count, 2)
                # a different artist/title but same isrc still resolves via the isrc key.
                self.assertEqual(client.cached_label("Someone Else", "Other Title", isrc="pt-isrc")["label"], "Night Label")

    def test_cached_label_is_none_and_makes_no_request_when_unknown(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            client = DiscogsClient(Path(temp_dir))
            with patch("discogs_agent.urllib.request.urlopen") as urlopen:
                self.assertIsNone(client.cached_label("Unknown Artist", "Unknown Track"))
            urlopen.assert_not_called()

    def test_discogs_down_degrades_to_null(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"DISCOGS_TOKEN": "test-token"}):
                client = DiscogsClient(Path(temp_dir))
            with patch.object(client, "_get", side_effect=DiscogsAgentError("down")):
                self.assertIsNone(client.enrich("Artist", "Track"))

    def test_bare_timeout_error_from_urlopen_degrades_to_null(self):
        # A stalled connection can raise a bare TimeoutError (not
        # urllib.error.URLError) - _get()'s except (URLError, JSONDecodeError)
        # alone wouldn't catch this, so it must not escape enrich() either.
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"DISCOGS_TOKEN": "test-token"}):
                client = DiscogsClient(Path(temp_dir))
                with patch("discogs_agent.urllib.request.urlopen", side_effect=TimeoutError("timed out")):
                    self.assertIsNone(client.enrich("Artist", "Track"))


if __name__ == "__main__":
    unittest.main()
