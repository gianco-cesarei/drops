import os
import unittest
from unittest.mock import patch

import run_web


class StartBgutilPotProviderTest(unittest.TestCase):
    def test_noop_when_server_entry_missing(self):
        with patch("run_web.os.path.isfile", return_value=False), \
             patch("run_web.subprocess.Popen") as popen, \
             patch.dict(os.environ, {}, clear=True):
            run_web.start_bgutil_pot_provider()
        popen.assert_not_called()
        self.assertNotIn("DROPS_YTDLP_BGUTIL_HTTP_BASE_URL", os.environ)

    def test_logs_directory_listing_when_server_entry_missing(self):
        with patch("run_web.os.path.isfile", return_value=False), \
             patch("run_web.os.listdir", return_value=["build", "package.json"]) as listdir, \
             patch("run_web.subprocess.Popen"), \
             patch.dict(os.environ, {}, clear=True), \
             self.assertLogs("drops.run_web", level="INFO") as logs:
            run_web.start_bgutil_pot_provider()
        listdir.assert_any_call(run_web.BGUTIL_SERVER_DIR)
        listdir.assert_any_call(f"{run_web.BGUTIL_SERVER_DIR}/build")
        self.assertIn("build", " ".join(logs.output))

    def test_noop_when_node_fails_to_launch(self):
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen", side_effect=OSError("no such file: node")), \
             patch.dict(os.environ, {}, clear=True):
            run_web.start_bgutil_pot_provider()
        self.assertNotIn("DROPS_YTDLP_BGUTIL_HTTP_BASE_URL", os.environ)

    def test_sets_env_var_once_port_is_reachable(self):
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen") as popen, \
             patch("run_web.socket.create_connection"), \
             patch.dict(os.environ, {}, clear=True):
            popen.return_value.poll.return_value = None  # still running
            run_web.start_bgutil_pot_provider()
            self.assertEqual(os.environ.get("DROPS_YTDLP_BGUTIL_HTTP_BASE_URL"), "http://127.0.0.1:4416")

    def test_gives_up_without_setting_env_var_when_port_never_opens(self):
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen") as popen, \
             patch("run_web.socket.create_connection", side_effect=OSError("connection refused")), \
             patch("run_web.time.sleep"), \
             patch("run_web.time.monotonic", side_effect=[0, 1, 20]), \
             patch.dict(os.environ, {}, clear=True):
            popen.return_value.poll.return_value = None  # still running
            run_web.start_bgutil_pot_provider()
        self.assertNotIn("DROPS_YTDLP_BGUTIL_HTTP_BASE_URL", os.environ)

    def test_logs_captured_output_when_process_exits_immediately(self):
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen") as popen, \
             patch.dict(os.environ, {}, clear=True), \
             self.assertLogs("drops.run_web", level="WARNING") as logs:
            popen.return_value.poll.return_value = 1
            popen.return_value.stdout.read.return_value = "Error: Cannot find module 'foo'\n"
            run_web.start_bgutil_pot_provider()
        self.assertNotIn("DROPS_YTDLP_BGUTIL_HTTP_BASE_URL", os.environ)
        log_text = " ".join(logs.output)
        self.assertIn("exit=1", log_text)
        self.assertIn("Cannot find module 'foo'", log_text)

    def test_launches_with_server_dir_as_cwd(self):
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen") as popen, \
             patch("run_web.socket.create_connection"), \
             patch.dict(os.environ, {}, clear=True):
            popen.return_value.poll.return_value = None
            run_web.start_bgutil_pot_provider()
        self.assertEqual(popen.call_args.kwargs.get("cwd"), run_web.BGUTIL_SERVER_DIR)


if __name__ == "__main__":
    unittest.main()
