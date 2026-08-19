import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

import yt_dlp

from download_engine import (
    DOWNLOAD_ABORT_MESSAGES,
    attempt_download,
    download_multi_source,
    find_soundcloud_match,
    score_candidate,
    similarity,
)


class SimilarityTest(unittest.TestCase):
    def test_identical_strings_score_one(self):
        self.assertEqual(similarity("Four Tet - Baby", "Four Tet - Baby"), 1.0)

    def test_case_and_punctuation_insensitive(self):
        self.assertGreater(similarity("Four Tet - Baby!!", "four tet baby"), 0.9)

    def test_unrelated_strings_score_low(self):
        self.assertLess(similarity("Four Tet - Baby", "Skrillex - Bangarang"), 0.4)


class ScoreCandidateTest(unittest.TestCase):
    def test_matching_title_and_uploader_scores_high(self):
        entry = {"title": "Baby", "uploader": "Four Tet"}
        self.assertGreaterEqual(score_candidate("Four Tet", "Baby", entry), 0.9)

    def test_combined_title_with_artist_prefix_still_matches(self):
        entry = {"title": "Four Tet - Baby", "uploader": "someone-reposting"}
        self.assertGreaterEqual(score_candidate("Four Tet", "Baby", entry), 0.6)

    def test_token_overlap_matches_reordered_noise_and_catalog_no(self):
        entry = {"title": "TEXT01 Four Tet - Baby (Vinyl Cut)", "uploader": "Text Records"}
        self.assertGreaterEqual(score_candidate("Four Tet", "Baby", entry), 0.6)

    def test_different_track_by_same_artist_is_rejected(self):
        # Even if artist matches 100%, different track title must score low / zero
        entry = {"title": "Four Tet - Teenage Birdsong", "uploader": "Four Tet"}
        self.assertLess(score_candidate("Four Tet", "Baby", entry), 0.3)

    def test_multi_word_title_different_track_by_same_artist_is_rejected(self):
        entry = {"title": "Rene Wise - Liquid Dancer [RYC012]", "uploader": "novafuture"}
        self.assertLess(score_candidate("Rene Wise", "Swamp Dancer", entry), 0.3)

    def test_unrelated_entry_scores_low(self):
        entry = {"title": "Totally Different Song", "uploader": "Nobody"}
        self.assertLess(score_candidate("Four Tet", "Baby", entry), 0.4)


class FindSoundcloudMatchTest(unittest.TestCase):
    def test_returns_none_without_any_metadata(self):
        self.assertIsNone(find_soundcloud_match(None, None, None, raw_title=None))

    def test_returns_none_when_search_raises(self):
        with patch("download_engine.yt_dlp.YoutubeDL", side_effect=RuntimeError("boom")):
            self.assertIsNone(find_soundcloud_match("Four Tet", "Baby", None))

    def test_options_include_ignoreerrors_and_ignore_no_formats_error(self):
        captured_options = {}

        def fake_ydl_init(options):
            captured_options.update(options)
            mock = MagicMock()
            mock.__enter__.return_value = mock
            mock.__exit__.return_value = False
            mock.extract_info.return_value = {"entries": []}
            return mock

        with patch("download_engine.yt_dlp.YoutubeDL", side_effect=fake_ydl_init):
            find_soundcloud_match("Four Tet", "Baby", 245)
        self.assertTrue(captured_options.get("ignoreerrors"))
        self.assertTrue(captured_options.get("ignore_no_formats_error"))

    def test_picks_best_scoring_entry_within_duration_tolerance(self):
        entries = [
            {"title": "Baby (slowed)", "uploader": "randomreupload", "duration": 400, "webpage_url": "https://soundcloud.com/x/wrong-duration"},
            {"title": "Baby", "uploader": "Four Tet", "duration": 245, "webpage_url": "https://soundcloud.com/fourtet/baby"},
            {"title": "Totally Unrelated", "uploader": "nobody", "duration": 246, "webpage_url": "https://soundcloud.com/x/unrelated"},
        ]
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value = fake_ydl
        fake_ydl.__exit__.return_value = False
        fake_ydl.extract_info.return_value = {"entries": entries}
        with patch("download_engine.yt_dlp.YoutubeDL", return_value=fake_ydl):
            result = find_soundcloud_match("Four Tet", "Baby", 245)
        self.assertEqual(result, "https://soundcloud.com/fourtet/baby")

    def test_skips_none_and_malformed_entries(self):
        entries = [
            None,
            "not a dict",
            {"no_url": "here"},
            {"title": "Baby", "uploader": "Four Tet", "duration": 245, "webpage_url": "https://soundcloud.com/fourtet/baby"},
        ]
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value = fake_ydl
        fake_ydl.__exit__.return_value = False
        fake_ydl.extract_info.return_value = {"entries": entries}
        with patch("download_engine.yt_dlp.YoutubeDL", return_value=fake_ydl):
            result = find_soundcloud_match("Four Tet", "Baby", 245)
        self.assertEqual(result, "https://soundcloud.com/fourtet/baby")

    def test_duration_close_match_accepts_candidate_with_lower_similarity(self):
        # Within ±5s duration, score >= 0.4 is accepted as confirmed by duration
        entries = [{"title": "TEXT001 Baby Extended", "uploader": "Unknown", "duration": 243, "webpage_url": "https://soundcloud.com/x/close-dur"}]
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value = fake_ydl
        fake_ydl.__exit__.return_value = False
        fake_ydl.extract_info.return_value = {"entries": entries}
        with patch("download_engine.yt_dlp.YoutubeDL", return_value=fake_ydl):
            result = find_soundcloud_match("Four Tet", "Baby", 245)
        self.assertEqual(result, "https://soundcloud.com/x/close-dur")

    def test_returns_none_when_no_candidate_within_duration_tolerance(self):
        entries = [{"title": "Baby", "uploader": "Four Tet", "duration": 400, "webpage_url": "https://soundcloud.com/x/wrong"}]
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value = fake_ydl
        fake_ydl.__exit__.return_value = False
        fake_ydl.extract_info.return_value = {"entries": entries}
        with patch("download_engine.yt_dlp.YoutubeDL", return_value=fake_ydl):
            self.assertIsNone(find_soundcloud_match("Four Tet", "Baby", 245))

    def test_duration_unknown_requires_higher_threshold(self):
        entries = [{"title": "Baby", "uploader": "Four Tet", "duration": 9999, "webpage_url": "https://soundcloud.com/fourtet/baby"}]
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value = fake_ydl
        fake_ydl.__exit__.return_value = False
        fake_ydl.extract_info.return_value = {"entries": entries}
        with patch("download_engine.yt_dlp.YoutubeDL", return_value=fake_ydl):
            result = find_soundcloud_match("Four Tet", "Baby", None)
        self.assertEqual(result, "https://soundcloud.com/fourtet/baby")

    def test_searches_multiple_queries_and_raw_title(self):
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value = fake_ydl
        fake_ydl.__exit__.return_value = False
        fake_ydl.extract_info.side_effect = [
            {"entries": []},
            {"entries": []},
            {"entries": [{"title": "Baby", "uploader": "Four Tet", "duration": 245, "webpage_url": "https://soundcloud.com/fourtet/baby"}]},
        ]
        with patch("download_engine.yt_dlp.YoutubeDL", return_value=fake_ydl):
            result = find_soundcloud_match("Four Tet", "Baby", 245, raw_title="TEXT001 - Baby")
        self.assertEqual(result, "https://soundcloud.com/fourtet/baby")
        self.assertEqual(fake_ydl.extract_info.call_count, 3)

    def test_returns_none_when_best_score_below_threshold(self):
        entries = [{"title": "Not Really Related", "uploader": "someone", "duration": 245, "webpage_url": "https://soundcloud.com/x/y"}]
        fake_ydl = MagicMock()
        fake_ydl.__enter__.return_value = fake_ydl
        fake_ydl.__exit__.return_value = False
        fake_ydl.extract_info.return_value = {"entries": entries}
        with patch("download_engine.yt_dlp.YoutubeDL", return_value=fake_ydl):
            self.assertIsNone(find_soundcloud_match("Four Tet", "Baby", 245))


class FakeSettings:
    max_duration_seconds = 900
    max_file_bytes = 100_000_000


class FakeYoutubeDL:
    """Records constructor options; extract_info behavior injected per test."""

    instances: list = []

    def __init__(self, options):
        self.options = options
        FakeYoutubeDL.instances.append(self)

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


class AttemptDownloadTest(unittest.TestCase):
    def setUp(self):
        FakeYoutubeDL.instances = []
        self.temp = tempfile.TemporaryDirectory()
        self.job_dir = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_success_writes_file_and_returns_info(self):
        def extract_info(self, source, download=True):
            Path(self.options["outtmpl"].rsplit("/", 1)[0], "audio.mp3").write_bytes(b"fake")
            return {"title": "Track", "duration": 10}

        FakeYoutubeDL.extract_info = extract_info
        with patch("download_engine.yt_dlp.YoutubeDL", FakeYoutubeDL):
            info = attempt_download(self.job_dir, "https://youtu.be/x", "320", FakeSettings(), __import__("time").monotonic())
        self.assertEqual(info["title"], "Track")
        self.assertEqual(len(FakeYoutubeDL.instances), 1)
        self.assertNotIn("proxy", FakeYoutubeDL.instances[0].options)

    def test_proxy_passed_through_when_given(self):
        def extract_info(self, source, download=True):
            Path(self.options["outtmpl"].rsplit("/", 1)[0], "audio.mp3").write_bytes(b"fake")
            return {"title": "Track", "duration": 10}

        FakeYoutubeDL.extract_info = extract_info
        with patch("download_engine.yt_dlp.YoutubeDL", FakeYoutubeDL):
            attempt_download(self.job_dir, "https://youtu.be/x", "320", FakeSettings(), __import__("time").monotonic(), proxy="http://proxy:8080")
        self.assertEqual(FakeYoutubeDL.instances[0].options["proxy"], "http://proxy:8080")

    def test_abort_message_is_not_retried(self):
        attempts = []

        def extract_info(self, source, download=True):
            attempts.append(1)
            raise yt_dlp.utils.DownloadError("Download size limit exceeded")

        FakeYoutubeDL.extract_info = extract_info
        with patch("download_engine.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("download_engine.time.sleep"):
            with self.assertRaises(yt_dlp.utils.DownloadError):
                attempt_download(self.job_dir, "https://youtu.be/x", "320", FakeSettings(), __import__("time").monotonic())
        self.assertEqual(len(attempts), 1)

    def test_retries_transient_downloaderror(self):
        attempts = []

        def extract_info(self, source, download=True):
            attempts.append(1)
            if len(attempts) < 3:
                raise yt_dlp.utils.DownloadError("Sign in to confirm you're not a bot")
            Path(self.options["outtmpl"].rsplit("/", 1)[0], "audio.mp3").write_bytes(b"fake")
            return {"title": "Track", "duration": 10}

        FakeYoutubeDL.extract_info = extract_info
        with patch("download_engine.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("download_engine.time.sleep"):
            info = attempt_download(self.job_dir, "https://youtu.be/x", "320", FakeSettings(), __import__("time").monotonic())
        self.assertEqual(len(attempts), 3)
        self.assertEqual(info["title"], "Track")

    def test_retries_clean_up_leftover_files_between_attempts(self):
        attempts = []

        def extract_info(self, source, download=True):
            attempts.append(1)
            out_dir = Path(self.options["outtmpl"].rsplit("/", 1)[0])
            if len(attempts) < 3:
                (out_dir / f"partial-{len(attempts)}.part").write_bytes(b"junk")
                raise yt_dlp.utils.DownloadError("Sign in to confirm you're not a bot")
            (out_dir / "audio.mp3").write_bytes(b"fake")
            return {"title": "Track", "duration": 10}

        FakeYoutubeDL.extract_info = extract_info
        with patch("download_engine.yt_dlp.YoutubeDL", FakeYoutubeDL), patch("download_engine.time.sleep"):
            attempt_download(self.job_dir, "https://youtu.be/x", "320", FakeSettings(), __import__("time").monotonic())
        remaining = list(self.job_dir.iterdir())
        self.assertEqual(len(remaining), 1)
        self.assertEqual(remaining[0].name, "audio.mp3")


class DownloadMultiSourceTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.job_dir = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def test_uses_soundcloud_when_match_found(self):
        with patch("download_engine.find_soundcloud_match", return_value="https://soundcloud.com/x/y"), \
             patch("download_engine.attempt_download", return_value={"title": "Track", "duration": 10}) as attempt:
            info, source = download_multi_source(self.job_dir, "job-1", "https://youtu.be/native", "Artist", "Title", 245, "320", FakeSettings(), __import__("time").monotonic())
        self.assertEqual(source, "soundcloud")
        self.assertEqual(attempt.call_args.args[1], "https://soundcloud.com/x/y")

    def test_falls_back_to_native_when_no_match(self):
        with patch("download_engine.find_soundcloud_match", return_value=None), \
             patch("download_engine.attempt_download", return_value={"title": "Track", "duration": 10}) as attempt:
            info, source = download_multi_source(self.job_dir, "job-1", "https://youtu.be/native", "Artist", "Title", 245, "320", FakeSettings(), __import__("time").monotonic())
        self.assertEqual(source, "youtube")
        self.assertEqual(attempt.call_args.args[1], "https://youtu.be/native")

    def test_falls_back_to_native_when_soundcloud_download_fails(self):
        with patch("download_engine.find_soundcloud_match", return_value="https://soundcloud.com/x/y"), \
             patch("download_engine.attempt_download", side_effect=[yt_dlp.utils.DownloadError("nope"), {"title": "Track", "duration": 10}]) as attempt:
            info, source = download_multi_source(self.job_dir, "job-1", "https://youtu.be/native", "Artist", "Title", 245, "320", FakeSettings(), __import__("time").monotonic())
        self.assertEqual(source, "youtube")
        self.assertEqual(attempt.call_count, 2)

    def test_native_source_label_detects_soundcloud_link(self):
        with patch("download_engine.find_soundcloud_match", return_value=None), \
             patch("download_engine.attempt_download", return_value={"title": "Track", "duration": 10}):
            _, source = download_multi_source(self.job_dir, "job-1", "https://soundcloud.com/native/track", None, None, None, "320", FakeSettings(), __import__("time").monotonic())
        self.assertEqual(source, "soundcloud")

    def test_never_calls_soundcloud_search_without_metadata(self):
        with patch("download_engine.find_soundcloud_match") as find_match, \
             patch("download_engine.attempt_download", return_value={"title": "Track", "duration": 10}):
            download_multi_source(self.job_dir, "job-1", "https://youtu.be/native", None, None, None, "320", FakeSettings(), __import__("time").monotonic())
        find_match.assert_called_once_with(None, None, None, raw_title=None)

    def test_proxy_only_reaches_native_attempt_not_soundcloud(self):
        calls = []

        def record_attempt(job_dir, url, quality, settings, started, *, proxy=None):
            calls.append({"url": url, "proxy": proxy})
            return {"title": "Track", "duration": 10}

        with patch("download_engine.find_soundcloud_match", return_value="https://soundcloud.com/x/y"), \
             patch("download_engine.attempt_download", side_effect=record_attempt):
            download_multi_source(self.job_dir, "job-1", "https://youtu.be/native", "Artist", "Title", 245, "320", FakeSettings(), __import__("time").monotonic(), proxy="http://proxy:8080")
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["url"], "https://soundcloud.com/x/y")
        self.assertIsNone(calls[0]["proxy"])  # soundcloud attempt never gets the proxy

    def test_proxy_reaches_native_attempt_when_soundcloud_has_no_match(self):
        calls = []

        def record_attempt(job_dir, url, quality, settings, started, *, proxy=None):
            calls.append({"url": url, "proxy": proxy})
            return {"title": "Track", "duration": 10}

        with patch("download_engine.find_soundcloud_match", return_value=None), \
             patch("download_engine.attempt_download", side_effect=record_attempt):
            download_multi_source(self.job_dir, "job-1", "https://youtu.be/native", None, None, None, "320", FakeSettings(), __import__("time").monotonic(), proxy="http://proxy:8080")
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0]["url"], "https://youtu.be/native")
        self.assertEqual(calls[0]["proxy"], "http://proxy:8080")


if __name__ == "__main__":
    unittest.main()
