import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from media_core import ytdlp_cookiefile


class YtdlpCookiefileTest(unittest.TestCase):
    def test_returns_none_when_env_unset(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(ytdlp_cookiefile())

    def test_returns_none_when_configured_path_does_not_exist(self):
        with patch.dict(os.environ, {"DROPS_YTDLP_COOKIES": "/no/such/file.txt"}):
            self.assertIsNone(ytdlp_cookiefile())

    def test_returns_path_when_file_exists(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            cookies = Path(temp_dir) / "cookies.txt"
            cookies.write_text("# Netscape HTTP Cookie File\n")
            with patch.dict(os.environ, {"DROPS_YTDLP_COOKIES": str(cookies)}):
                self.assertEqual(ytdlp_cookiefile(), str(cookies))

    def test_copies_to_writable_location_when_source_is_read_only(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            cookies = Path(temp_dir) / "cookies.txt"
            cookies.write_text("# Netscape HTTP Cookie File\nsecret\n")
            cookies.chmod(0o444)
            tmp_dir = Path(temp_dir) / "tmp"
            tmp_dir.mkdir()
            try:
                with patch.dict(os.environ, {"DROPS_YTDLP_COOKIES": str(cookies)}), \
                     patch("media_core.tempfile.gettempdir", return_value=str(tmp_dir)):
                    result = ytdlp_cookiefile()
                    self.assertEqual(result, str(tmp_dir / "drops-cookies.txt"))
                    self.assertTrue(os.access(result, os.W_OK))
                    self.assertEqual(Path(result).read_text(), cookies.read_text())
                    # Second call reuses the existing copy instead of recopying.
                    self.assertEqual(ytdlp_cookiefile(), result)
            finally:
                cookies.chmod(0o644)


if __name__ == "__main__":
    unittest.main()
