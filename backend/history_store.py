"""Persistenza atomica dello storico download locale di Drops."""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any


class DownloadHistory:
    def __init__(self, path: Path, max_records: int = 500):
        self.path = path
        self.max_records = max_records
        self._lock = threading.Lock()

    def read(self, limit: int = 100) -> list[dict[str, Any]]:
        try:
            data = json.loads(self.path.read_text(encoding="utf-8"))
            records = data if isinstance(data, list) else []
        except (FileNotFoundError, json.JSONDecodeError, OSError):
            records = []
        return records[: max(1, min(limit, self.max_records))]

    def upsert(self, record: dict[str, Any]) -> None:
        with self._lock:
            records = self.read(self.max_records)
            records = [item for item in records if item.get("id") != record.get("id")]
            records.insert(0, record)
            self._write(records)

    def update(self, record_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
        with self._lock:
            records = self.read(self.max_records)
            updated = None
            for record in records:
                if record.get("id") == record_id:
                    record.update(updates)
                    updated = dict(record)
                    break
            if updated is not None:
                self._write(records)
            return updated

    def get(self, record_id: str) -> dict[str, Any] | None:
        return next(
            (item for item in self.read(self.max_records) if item.get("id") == record_id),
            None,
        )

    def find_by_spotify_id(self, spotify_track_id: str) -> dict[str, Any] | None:
        return next(
            (
                item
                for item in self.read(self.max_records)
                if item.get("spotify_track_id") == spotify_track_id
            ),
            None,
        )

    def _write(self, records: list[dict[str, Any]]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(self.path.suffix + ".tmp")
        temp.write_text(
            json.dumps(records[: self.max_records], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temp.replace(self.path)
