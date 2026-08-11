import os
import tempfile
import unittest
from unittest.mock import MagicMock, patch

_STATE = tempfile.TemporaryDirectory()
os.environ["DROPS_STATE_DIR"] = _STATE.name
os.environ["DROPS_DEFAULT_SAVE_DIR"] = _STATE.name

import main  # noqa: E402


class MainHelpersTest(unittest.TestCase):
    def setUp(self):
        main.HISTORY_FILE.unlink(missing_ok=True)
        main.preview_cache.clear()

    def test_supported_url_checks_hostname_boundary(self):
        self.assertTrue(main.is_supported_url("https://soundcloud.com/user/track"))
        self.assertTrue(main.is_supported_url("https://www.youtube.com/watch?v=abc"))
        self.assertFalse(main.is_supported_url("https://youtube.com.evil.example/file"))
        self.assertFalse(main.is_supported_url("javascript:alert(1)"))

    def test_playlist_resolver_normalizes_youtube_entries(self):
        info = {
            "title": "Playlist test",
            "entries": [
                {
                    "id": "abc123",
                    "title": "Brano test",
                    "extractor_key": "Youtube",
                }
            ],
        }
        ydl = MagicMock()
        ydl.__enter__.return_value.extract_info.return_value = info
        with patch.object(main.yt_dlp, "YoutubeDL", return_value=ydl):
            result = main.resolve_playlist(
                main.PlaylistRequest(url="https://www.youtube.com/playlist?list=test")
            )

        self.assertEqual(result["count"], 1)
        self.assertEqual(
            result["entries"][0]["url"],
            "https://www.youtube.com/watch?v=abc123",
        )

    def test_playlist_marks_files_already_in_selected_folder(self):
        with tempfile.TemporaryDirectory() as folder:
            open(os.path.join(folder, "So Inagawa - Logo Queen.mp3"), "wb").close()
            main.selected_destinations["folder-token"] = main.Path(folder)
            info = {
                "title": "CABARET",
                "entries": [
                    {
                        "id": "one",
                        "title": "So Inagawa - Logo Queen",
                        "extractor_key": "Youtube",
                    },
                    {
                        "id": "two",
                        "title": "So Inagawa - Sensibilia",
                        "extractor_key": "Youtube",
                    },
                ],
            }
            ydl = MagicMock()
            ydl.__enter__.return_value.extract_info.return_value = info
            with patch.object(main.yt_dlp, "YoutubeDL", return_value=ydl):
                result = main.resolve_playlist(
                    main.PlaylistRequest(
                        url="https://www.youtube.com/playlist?list=test",
                        destination_token="folder-token",
                    )
                )
            main.selected_destinations.pop("folder-token", None)

        self.assertEqual(result["existing_count"], 1)
        self.assertTrue(result["entries"][0]["already_downloaded"])
        self.assertFalse(result["entries"][1]["already_downloaded"])

    def test_media_inspect_creates_temporary_preview(self):
        info = {
            "title": "Brano test",
            "duration": 180,
            "url": "https://media.example/audio.m4a",
        }
        ydl = MagicMock()
        ydl.__enter__.return_value.extract_info.return_value = info
        with patch.object(main.yt_dlp, "YoutubeDL", return_value=ydl):
            result = main.inspect_media(
                main.MediaInspectRequest(url="https://www.youtube.com/watch?v=abc")
            )

        token = result["preview_url"].rsplit("/", 1)[-1]
        self.assertEqual(result["title"], "Brano test")
        self.assertEqual(main.preview_cache[token]["url"], info["url"])

    def test_history_persists_and_reveals_known_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = main.Path(folder) / "Brano.mp3"
            path.write_bytes(b"audio")
            main.append_download_history(
                {
                    "id": "job-1",
                    "title": "Brano",
                    "saved_path": str(path),
                    "completed_at": 1,
                }
            )
            history = main.download_history()
            with patch.object(main, "reveal_local_file") as reveal:
                result = main.reveal_history_file("job-1")

        self.assertEqual(history["total"], 1)
        self.assertTrue(history["items"][0]["exists"])
        self.assertTrue(result["opened"])
        reveal.assert_called_once_with(path)

    def test_bpm_result_is_available_by_spotify_id(self):
        with tempfile.TemporaryDirectory() as folder:
            path = main.Path(folder) / "Brano.mp3"
            path.write_bytes(b"audio")
            main.append_download_history(
                {
                    "id": "job-bpm",
                    "title": "Brano",
                    "saved_path": str(path),
                    "format": "audio",
                    "spotify_track_id": "spotify-123",
                }
            )
            with patch.object(
                main,
                "analyze_bpm",
                return_value={
                    "bpm": 124.1,
                    "bpm_rounded": 124,
                    "bpm_confidence": 0.88,
                    "bpm_candidates": [124.1, 62.05],
                    "bpm_source": "test",
                    "bpm_manual": False,
                },
            ):
                main.analyze_download_bpm("job-bpm")

        result = main.bpm_for_spotify("spotify-123")
        self.assertEqual(result["bpm_status"], "ready")
        self.assertEqual(result["bpm_rounded"], 124)
        self.assertEqual(result["spotify_track_id"], "spotify-123")

    def test_bpm_spotify_reports_not_downloaded(self):
        result = main.bpm_for_spotify("missing-track")
        self.assertEqual(result["bpm_status"], "not_available")
        self.assertEqual(result["reason"], "track_not_downloaded")

    def test_version_comparison_supports_beta_channel(self):
        self.assertLess(main.version_tuple("1.1.0-beta.1"), main.version_tuple("1.1.0"))
        self.assertGreater(main.version_tuple("1.1.0-beta.2"), main.version_tuple("1.1.0-beta.1"))
        self.assertGreater(main.version_tuple("1.1.0-beta.1"), main.version_tuple("1.0.5"))


def tearDownModule():
    _STATE.cleanup()


if __name__ == "__main__":
    unittest.main()
