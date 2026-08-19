import http.client
import json
import os
import tempfile
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import MagicMock, patch

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
            with patch.dict(os.environ, {"DROPS_YTDLP_BGUTIL_SCRIPT": missing, "DROPS_YTDLP_BGUTIL_HTTP_BASE_URL": ""}):
                args = ytdlp_extractor_args()
        self.assertNotIn("youtubepot-bgutilscript", args)
        self.assertNotIn("youtubepot-bgutilhttp", args)

    def test_included_when_package_and_script_dir_present(self):
        with patch("media_core.importlib.metadata.distribution", return_value=object()), \
             tempfile.TemporaryDirectory() as script_dir:
            with patch.dict(os.environ, {"DROPS_YTDLP_BGUTIL_SCRIPT": script_dir, "DROPS_YTDLP_BGUTIL_HTTP_BASE_URL": ""}):
                args = ytdlp_extractor_args()
        self.assertEqual(args["youtubepot-bgutilscript"], {"server_home": script_dir})

    def test_http_server_used_when_base_url_configured(self):
        with patch("media_core.importlib.metadata.distribution", return_value=object()), \
             patch.dict(os.environ, {"DROPS_YTDLP_BGUTIL_HTTP_BASE_URL": "http://127.0.0.1:4416"}):
            args = ytdlp_extractor_args()
        self.assertEqual(args["youtubepot-bgutilhttp"], {"base_url": "http://127.0.0.1:4416"})
        self.assertNotIn("youtubepot-bgutilscript", args)

    def test_http_server_takes_priority_over_script_mode(self):
        with patch("media_core.importlib.metadata.distribution", return_value=object()), \
             tempfile.TemporaryDirectory() as script_dir:
            with patch.dict(os.environ, {
                "DROPS_YTDLP_BGUTIL_HTTP_BASE_URL": "http://127.0.0.1:4416",
                "DROPS_YTDLP_BGUTIL_SCRIPT": script_dir,
            }):
                args = ytdlp_extractor_args()
        self.assertIn("youtubepot-bgutilhttp", args)
        self.assertNotIn("youtubepot-bgutilscript", args)

    def test_http_server_blank_falls_through_to_script_mode(self):
        with patch("media_core.importlib.metadata.distribution", return_value=object()), \
             tempfile.TemporaryDirectory() as script_dir:
            with patch.dict(os.environ, {"DROPS_YTDLP_BGUTIL_HTTP_BASE_URL": "   ", "DROPS_YTDLP_BGUTIL_SCRIPT": script_dir}):
                args = ytdlp_extractor_args()
        self.assertEqual(args["youtubepot-bgutilscript"], {"server_home": script_dir})


class ParseArtistTitleTest(unittest.TestCase):
    def test_splits_on_hyphen(self):
        self.assertEqual(media_core.parse_artist_title("Four Tet - Baby"), ("Four Tet", "Baby"))

    def test_splits_on_en_dash(self):
        self.assertEqual(media_core.parse_artist_title("Bicep – Glue"), ("Bicep", "Glue"))

    def test_strips_official_video_noise(self):
        self.assertEqual(
            media_core.parse_artist_title("Overmono - So U Kno (Official Video)"),
            ("Overmono", "So U Kno"),
        )

    def test_strips_original_mix_and_label_bracket(self):
        self.assertEqual(
            media_core.parse_artist_title("Job Jobse - Wavez (Original Mix) [Klasse Wrecks]"),
            ("Job Jobse", "Wavez"),
        )

    def test_strips_free_download_and_premiere(self):
        self.assertEqual(
            media_core.parse_artist_title("Artist - Track [Free Download] PREMIERE"),
            ("Artist", "Track"),
        )

    def test_falls_back_to_uploader_when_no_separator(self):
        self.assertEqual(
            media_core.parse_artist_title("Just A Title", fallback_artist="Some Channel"),
            ("Some Channel", "Just A Title"),
        )

    def test_strips_vinyl_cut_positions_from_artist_and_title(self):
        self.assertEqual(
            media_core.parse_artist_title("A1. Traumer - Hoodlum (Original Mix)"),
            ("Traumer", "Hoodlum"),
        )
        self.assertEqual(
            media_core.parse_artist_title("Traumer - B2. Hoodlum"),
            ("Traumer", "Hoodlum"),
        )

    def test_drops_curator_channel_as_fallback_artist(self):
        self.assertEqual(
            media_core.parse_artist_title("Deep Techno Track", fallback_artist="HATE"),
            (None, "Deep Techno Track"),
        )
        self.assertEqual(
            media_core.parse_artist_title("Minimal Track", fallback_artist="Moskalus Premiere"),
            (None, "Minimal Track"),
        )

    def test_falls_back_to_none_artist_when_no_separator_and_no_uploader(self):
        self.assertEqual(media_core.parse_artist_title("Just A Title"), (None, "Just A Title"))


class ResolveTrackTest(unittest.TestCase):
    def test_youtube_uses_oembed(self):
        payload = json.dumps({
            "title": "Overmono - So U Kno (Official Video)",
            "author_name": "Overmono",
            "thumbnail_url": "https://i.ytimg.com/vi/abc/hqdefault.jpg",
        }).encode()
        response = MagicMock()
        response.read.return_value = payload
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        with patch("media_core.urllib.request.urlopen", return_value=response) as urlopen:
            result = media_core.resolve_track("https://youtu.be/abc123")
        self.assertEqual(result["title"], "So U Kno")
        self.assertEqual(result["artist"], "Overmono")
        self.assertEqual(result["cover_url"], "https://i.ytimg.com/vi/abc/hqdefault.jpg")
        self.assertEqual(result["raw_title"], "Overmono - So U Kno (Official Video)")
        self.assertIsNone(result["duration"])
        self.assertIn("youtube.com/oembed", urlopen.call_args.args[0].full_url)

    def test_soundcloud_uses_soundcloud_oembed(self):
        payload = json.dumps({
            "title": "Artist - Track",
            "author_name": "Artist",
            "thumbnail_url": "https://i1.sndcdn.com/x.jpg",
        }).encode()
        response = MagicMock()
        response.read.return_value = payload
        response.__enter__.return_value = response
        response.__exit__.return_value = False
        with patch("media_core.urllib.request.urlopen", return_value=response) as urlopen:
            result = media_core.resolve_track("https://soundcloud.com/artist/track")
        self.assertEqual(result["title"], "Track")
        self.assertIn("soundcloud.com/oembed", urlopen.call_args.args[0].full_url)

    def test_falls_back_to_ytdlp_when_oembed_fails(self):
        with patch("media_core.urllib.request.urlopen", side_effect=urllib.error.URLError("no network")), \
             patch("media_core.yt_dlp.YoutubeDL") as fake_ydl_class:
            fake_ydl = MagicMock()
            fake_ydl.__enter__.return_value = fake_ydl
            fake_ydl.__exit__.return_value = False
            fake_ydl.extract_info.return_value = {
                "title": "Artist - Track (Original Mix)",
                "uploader": "Artist",
                "thumbnail": "https://example.com/cover.jpg",
                "duration": 245,
            }
            fake_ydl_class.return_value = fake_ydl
            result = media_core.resolve_track("https://youtu.be/private123")
        self.assertEqual(result["title"], "Track")
        self.assertEqual(result["artist"], "Artist")
        self.assertEqual(result["duration"], 245)
        fake_ydl_class.assert_called_once()
        options = fake_ydl_class.call_args.args[0]
        self.assertTrue(options["skip_download"])
        fake_ydl.extract_info.assert_called_once_with("https://youtu.be/private123", download=False)

    def test_oembed_http_exception_not_urlerror_falls_back(self):
        # http.client exceptions (e.g. IncompleteRead) are NOT OSError
        # subclasses, so urllib does not wrap them into URLError - _oembed
        # must still catch them (not just URLError/ValueError) so resolve_track
        # falls back to yt-dlp instead of letting the exception escape.
        with patch("media_core.urllib.request.urlopen", side_effect=http.client.IncompleteRead(b"")), \
             patch("media_core.yt_dlp.YoutubeDL") as fake_ydl_class:
            fake_ydl = MagicMock()
            fake_ydl.__enter__.return_value = fake_ydl
            fake_ydl.__exit__.return_value = False
            fake_ydl.extract_info.return_value = {
                "title": "Artist - Track",
                "uploader": "Artist",
                "thumbnail": "https://example.com/cover.jpg",
                "duration": 120,
            }
            fake_ydl_class.return_value = fake_ydl
            result = media_core.resolve_track("https://youtu.be/httpexc")
        self.assertEqual(result["title"], "Track")
        self.assertEqual(result["artist"], "Artist")
        fake_ydl.extract_info.assert_called_once()

    def test_extract_info_returns_none_without_raising(self):
        # extract_info can return None without raising on some flat/playlist
        # extraction paths; resolve_track must degrade to the all-None result
        # instead of crashing on info.get(...).
        with patch("media_core.urllib.request.urlopen", side_effect=urllib.error.URLError("no network")), \
             patch("media_core.yt_dlp.YoutubeDL") as fake_ydl_class:
            fake_ydl = MagicMock()
            fake_ydl.__enter__.return_value = fake_ydl
            fake_ydl.__exit__.return_value = False
            fake_ydl.extract_info.return_value = None
            fake_ydl_class.return_value = fake_ydl
            result = media_core.resolve_track("https://youtu.be/none-info")
        self.assertIsNone(result["title"])
        self.assertIsNone(result["artist"])
        self.assertIsNone(result["raw_title"])
        self.assertIsNone(result["cover_url"])
        self.assertIsNone(result["duration"])

    def test_never_raises_when_everything_fails(self):
        with patch("media_core.urllib.request.urlopen", side_effect=urllib.error.URLError("no network")), \
             patch("media_core.yt_dlp.YoutubeDL", side_effect=RuntimeError("boom")):
            result = media_core.resolve_track("https://youtu.be/gone")
        self.assertIsNone(result["title"])
        self.assertIsNone(result["artist"])
        self.assertIsNone(result["raw_title"])
        self.assertIsNone(result["cover_url"])
        self.assertIsNone(result["duration"])


if __name__ == "__main__":
    unittest.main()
