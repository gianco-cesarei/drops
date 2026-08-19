import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import media_core
from media_core import YTDLP_PLAYER_CLIENTS, ytdlp_cookiefile, ytdlp_extractor_args, ytdlp_proxy


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


class YtdlpProxyTest(unittest.TestCase):
    def test_returns_none_when_unset(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(ytdlp_proxy())

    def test_returns_none_when_blank(self):
        with patch.dict(os.environ, {"DROPS_YTDLP_PROXY": "   "}):
            self.assertIsNone(ytdlp_proxy())

    def test_returns_configured_value(self):
        with patch.dict(os.environ, {"DROPS_YTDLP_PROXY": "http://proxy.example:8080"}):
            self.assertEqual(ytdlp_proxy(), "http://proxy.example:8080")


class PotProviderExtractorArgsTest(unittest.TestCase):
    def test_omitted_when_package_not_installed(self):
        with patch("media_core.importlib.metadata.distribution", side_effect=media_core.importlib.metadata.PackageNotFoundError):
            args = ytdlp_extractor_args()
        self.assertNotIn("youtubepot-bgutilscript", args)
        self.assertEqual(args["youtube"]["player_client"], YTDLP_PLAYER_CLIENTS)

    def test_omitted_when_script_dir_missing(self):
        with patch("media_core.importlib.metadata.distribution", return_value=object()), \
             tempfile.TemporaryDirectory() as empty_parent:
            missing = os.path.join(empty_parent, "no-such-script-dir")
            with patch.dict(os.environ, {"DROPS_YTDLP_BGUTIL_SCRIPT": missing}):
                args = ytdlp_extractor_args()
        self.assertNotIn("youtubepot-bgutilscript", args)

    def test_included_when_package_and_script_dir_present(self):
        with patch("media_core.importlib.metadata.distribution", return_value=object()), \
             tempfile.TemporaryDirectory() as script_dir:
            with patch.dict(os.environ, {"DROPS_YTDLP_BGUTIL_SCRIPT": script_dir}):
                args = ytdlp_extractor_args()
        self.assertEqual(args["youtubepot-bgutilscript"], {"server_home": script_dir})


if __name__ == "__main__":
    unittest.main()
