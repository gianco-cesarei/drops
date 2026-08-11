import math
import tempfile
import unittest
import wave
from array import array
from pathlib import Path

from bpm_analyzer import BpmAnalysisError, analyze_bpm


def write_click_track(path: Path, bpm: float, seconds: int = 24, sample_rate: int = 22050):
    samples = array("h", [0]) * (seconds * sample_rate)
    step = int(sample_rate * 60.0 / bpm)
    burst = int(sample_rate * 0.025)
    for start in range(0, len(samples), step):
        for offset in range(min(burst, len(samples) - start)):
            envelope = 1.0 - (offset / burst)
            value = int(24000 * envelope * math.sin(2 * math.pi * 1200 * offset / sample_rate))
            samples[start + offset] = value
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate)
        output.writeframes(samples.tobytes())


class BpmAnalyzerTest(unittest.TestCase):
    def test_detects_steady_120_bpm_click_track(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "click-120.wav"
            write_click_track(path, 120.0)
            result = analyze_bpm(path)

        self.assertAlmostEqual(result["bpm"], 120.0, delta=5.0)
        self.assertIn(120, [round(value) for value in result["bpm_candidates"]])
        self.assertGreater(result["bpm_confidence"], 0.5)

    def test_rejects_silence(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "silence.wav"
            with wave.open(str(path), "wb") as output:
                output.setnchannels(1)
                output.setsampwidth(2)
                output.setframerate(22050)
                output.writeframes(array("h", [0]) * 22050)
            with self.assertRaises(BpmAnalysisError):
                analyze_bpm(path)


if __name__ == "__main__":
    unittest.main()
