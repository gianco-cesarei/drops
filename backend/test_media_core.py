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


if __name__ == "__main__":
    unittest.main()
