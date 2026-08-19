import os
import unittest
from unittest.mock import MagicMock, patch

import run_web


class StartBgutilPotProviderTest(unittest.TestCase):
    def test_noop_when_server_entry_missing(self):
        with patch("run_web.os.path.isfile", return_value=False), \
             patch("run_web.subprocess.Popen") as popen, \
             patch("run_web.threading.Thread") as thread:
            run_web.start_bgutil_pot_provider()
        popen.assert_not_called()
        thread.assert_not_called()

    def test_logs_directory_listing_when_server_entry_missing(self):
        with patch("run_web.os.path.isfile", return_value=False), \
             patch("run_web.os.listdir", return_value=["build", "package.json"]) as listdir, \
             patch("run_web.subprocess.Popen"), \
             patch("run_web.threading.Thread"), \
             self.assertLogs("drops.run_web", level="INFO") as logs:
            run_web.start_bgutil_pot_provider()
        listdir.assert_any_call(run_web.BGUTIL_SERVER_DIR)
        listdir.assert_any_call(f"{run_web.BGUTIL_SERVER_DIR}/build")
        self.assertIn("build", " ".join(logs.output))

    def test_noop_when_node_fails_to_launch(self):
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen", side_effect=OSError("no such file: node")), \
             patch("run_web.threading.Thread") as thread, \
             self.assertLogs("drops.run_web", level="WARNING") as logs:
            run_web.start_bgutil_pot_provider()
        thread.assert_not_called()
        self.assertIn("no such file: node", " ".join(logs.output))

    def test_launches_with_server_dir_as_cwd_and_spawns_readiness_thread(self):
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen") as popen, \
             patch("run_web.threading.Thread") as thread:
            run_web.start_bgutil_pot_provider()
        self.assertEqual(popen.call_args.kwargs.get("cwd"), run_web.BGUTIL_SERVER_DIR)
        thread.assert_called_once()
        self.assertEqual(thread.call_args.kwargs.get("target"), run_web._log_bgutil_readiness)
        self.assertEqual(thread.call_args.kwargs.get("args"), (popen.return_value,))
        self.assertTrue(thread.call_args.kwargs.get("daemon"))
        thread.return_value.start.assert_called_once()

    def test_never_sets_env_var_itself_env_is_static_via_dockerfile(self):
        # DROPS_YTDLP_BGUTIL_HTTP_BASE_URL is set in the Dockerfile now, not
        # by this function - it must never touch os.environ at all.
        with patch("run_web.os.path.isfile", return_value=True), \
             patch("run_web.subprocess.Popen"), \
             patch("run_web.threading.Thread"), \
             patch.dict(os.environ, {}, clear=True):
            run_web.start_bgutil_pot_provider()
            self.assertNotIn("DROPS_YTDLP_BGUTIL_HTTP_BASE_URL", os.environ)


class LogBgutilReadinessTest(unittest.TestCase):
    """_log_bgutil_readiness runs in a background thread in production; these
    tests call it directly (synchronously) to exercise its logic."""

    def test_logs_ready_when_port_reachable(self):
        process = MagicMock()
        process.poll.return_value = None
        with patch("run_web.socket.create_connection"), \
             self.assertLogs("drops.run_web", level="INFO") as logs:
            run_web._log_bgutil_readiness(process)
        self.assertIn("PO token abilitato", " ".join(logs.output))

    def test_logs_captured_output_when_process_exits_immediately(self):
        process = MagicMock()
        process.poll.return_value = 1
        process.stdout.read.return_value = "Error: Cannot find module 'foo'\n"
        with self.assertLogs("drops.run_web", level="WARNING") as logs:
            run_web._log_bgutil_readiness(process)
        log_text = " ".join(logs.output)
        self.assertIn("exit=1", log_text)
        self.assertIn("Cannot find module 'foo'", log_text)

    def test_gives_up_logging_when_port_never_opens(self):
        process = MagicMock()
        process.poll.return_value = None
        with patch("run_web.socket.create_connection", side_effect=OSError("connection refused")), \
             patch("run_web.time.sleep"), \
             patch("run_web.time.monotonic", side_effect=[0, 1, 100]), \
             self.assertLogs("drops.run_web", level="WARNING") as logs:
            run_web._log_bgutil_readiness(process)
        self.assertIn("non pronto entro", " ".join(logs.output))


if __name__ == "__main__":
    unittest.main()
