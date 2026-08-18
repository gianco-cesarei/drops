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

    def test_discogs_down_degrades_to_null(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            with patch.dict(os.environ, {"DISCOGS_TOKEN": "test-token"}):
                client = DiscogsClient(Path(temp_dir))
            with patch.object(client, "_get", side_effect=DiscogsAgentError("down")):
                self.assertIsNone(client.enrich("Artist", "Track"))


if __name__ == "__main__":
    unittest.main()
