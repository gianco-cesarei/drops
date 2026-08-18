import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from bpm_jobs import BpmJobManager, stable_track_key


class BpmJobsTest(unittest.TestCase):
    def test_stable_key_precedence(self):
        self.assertEqual(stable_track_key("sp1", "isrc1", "A", "T"), "isrc:ISRC1")
        self.assertEqual(stable_track_key("sp1", None, "A", "T"), "spotify:sp1")
        self.assertEqual(stable_track_key(None, None, "A/B", "T!"), "name:a b:t")

    def test_compute_passes_cookiefile_to_ytdlp_when_configured(self):
        with tempfile.TemporaryDirectory() as root:
            cookies = Path(root) / "cookies.txt"
            cookies.write_text("# Netscape HTTP Cookie File\n")
            manager = BpmJobManager(Path(root))
            seen_options = []

            class FakeYoutubeDL:
                def __init__(self, options):
                    seen_options.append(options)

                def __enter__(self):
                    return self

                def __exit__(self, *exc):
                    return False

                def extract_info(self, source, download=True):
                    return {}

            work_dir = Path(root) / "job"
            work_dir.mkdir()
            with patch.dict(os.environ, {"DROPS_YTDLP_COOKIES": str(cookies)}), patch("bpm_jobs.yt_dlp.YoutubeDL", FakeYoutubeDL):
                with self.assertRaises(RuntimeError):
                    manager._compute(work_dir, "Artist", "Title", None, None)
            self.assertTrue(seen_options)
            self.assertEqual(seen_options[0]["cookiefile"], str(cookies))

    def test_compute_omits_cookiefile_when_not_configured(self):
        with tempfile.TemporaryDirectory() as root:
            manager = BpmJobManager(Path(root))
            seen_options = []

            class FakeYoutubeDL:
                def __init__(self, options):
                    seen_options.append(options)

                def __enter__(self):
                    return self

                def __exit__(self, *exc):
                    return False

                def extract_info(self, source, download=True):
                    return {}

            work_dir = Path(root) / "job"
            work_dir.mkdir()
            with patch.dict(os.environ, {}, clear=True), patch("bpm_jobs.yt_dlp.YoutubeDL", FakeYoutubeDL):
                with self.assertRaises(RuntimeError):
                    manager._compute(work_dir, "Artist", "Title", None, None)
            self.assertTrue(seen_options)
            self.assertNotIn("cookiefile", seen_options[0])

    def test_result_is_cached_without_second_download(self):
        with tempfile.TemporaryDirectory() as root, ThreadPoolExecutor(max_workers=1) as executor:
            manager = BpmJobManager(Path(root))
            manager.bind_executor(executor)
            with patch.object(manager, "_compute", return_value={"bpm": 126.0, "bpm_confidence": 0.8}):
                first = manager.submit(track_key="sp1", artist="Artist", title="Title", isrc=None, source_url=None)
                executor.shutdown(wait=True)
            self.assertEqual(manager.get(first["job_id"])["bpm"], 126.0)
            cached = BpmJobManager(Path(root))
            cached.bind_executor(None)
            result = cached.submit(track_key="sp1", artist="Artist", title="Title", isrc=None, source_url=None)
            self.assertEqual(result["status"], "ready")
            self.assertEqual(result["bpm"], 126.0)
