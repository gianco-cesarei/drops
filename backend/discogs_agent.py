"""Best-effort Discogs enrichment for Drops music metadata."""

from __future__ import annotations

import hashlib
import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

DISCOGS_API = "https://api.discogs.com"
DEFAULT_USER_AGENT = "Drops/1.0 +https://drops.giancarlocesarei.workers.dev"


class DiscogsAgentError(RuntimeError):
    pass


class DiscogsClient:
    """Authenticated Discogs client with disk cache and 60 req/min pacing."""

    def __init__(self, state_dir: Path, cache_dir: Path | None = None):
        self.token = os.environ.get("DISCOGS_TOKEN", "").strip()
        self.user_agent = os.environ.get("DISCOGS_USER_AGENT", DEFAULT_USER_AGENT).strip()
        self.cache_dir = cache_dir or state_dir / "discogs-cache"
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.brain_file = state_dir / "discogs-brain.json"
        self._lock = threading.Lock()
        self._last_request = 0.0

    @property
    def enabled(self) -> bool:
        return bool(self.token)

    def _cache_path(self, url: str) -> Path:
        return self.cache_dir / (hashlib.sha256(url.encode()).hexdigest() + ".json")

    def _get(self, path: str, params: dict[str, str] | None = None) -> dict[str, Any]:
        if not self.token:
            raise DiscogsAgentError("DISCOGS_TOKEN non configurato")
        query = urllib.parse.urlencode({key: value for key, value in (params or {}).items() if value})
        url = f"{DISCOGS_API}{path}" + (f"?{query}" if query else "")
        cache_path = self._cache_path(url)
        try:
            return json.loads(cache_path.read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            pass
        with self._lock:
            wait = 1.0 - (time.monotonic() - self._last_request)
            if wait > 0:
                time.sleep(wait)
            self._last_request = time.monotonic()
        request = urllib.request.Request(url, headers={"Authorization": f"Discogs token={self.token}", "User-Agent": self.user_agent})
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = json.loads(response.read())
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                time.sleep(2)
            raise DiscogsAgentError(f"Discogs HTTP {exc.code}") from exc
        except (urllib.error.URLError, json.JSONDecodeError) as exc:
            raise DiscogsAgentError("Discogs non raggiungibile") from exc
        cache_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return payload

    @staticmethod
    def _release_payload(payload: dict[str, Any]) -> dict[str, Any] | None:
        if not payload or not payload.get("id"):
            return None
        labels = [item.get("name") for item in payload.get("labels") or [] if item.get("name")]
        artists = [item.get("name") for item in payload.get("artists") or [] if item.get("name")]
        styles = sorted(set((payload.get("styles") or []) + (payload.get("genres") or [])))
        return {
            "label": labels[0] if labels else None,
            "labels": labels,
            "catalog_no": next((item.get("catno") for item in payload.get("labels") or [] if item.get("catno")), None),
            "year": payload.get("year"),
            "country": payload.get("country"),
            "styles": styles,
            "artists": artists,
            "discogs_url": payload.get("uri") or f"https://www.discogs.com/release/{payload['id']}",
            "release_id": payload.get("id"),
        }

    def _record_brain(self, result: dict[str, Any]) -> None:
        if not result or not result.get("label"):
            return
        try:
            current = json.loads(self.brain_file.read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            current = {"labels": [], "artists": [], "releases": [], "relations": []}
        label = result["label"]
        current["labels"] = sorted(set(current.get("labels", []) + [label]))
        current["artists"] = sorted(set(current.get("artists", []) + result.get("artists", [])))
        release = {key: result.get(key) for key in ("release_id", "label", "catalog_no", "year", "country", "styles", "discogs_url")}
        current["releases"] = [item for item in current.get("releases", []) if item.get("release_id") != release["release_id"]] + [release]
        current["relations"] = [item for item in current.get("relations", []) if item.get("release_id") != release["release_id"]]
        current["relations"] += [{"release_id": release["release_id"], "label": label, "artist": artist, "relation": "releases_on", "source": "discogs"} for artist in result.get("artists", [])]
        temp = self.brain_file.with_suffix(".tmp")
        temp.write_text(json.dumps(current, ensure_ascii=False, indent=2), encoding="utf-8")
        temp.replace(self.brain_file)

    def enrich(self, artist: str, title: str, isrc: str | None = None, catalog_no: str | None = None, barcode: str | None = None) -> dict[str, Any] | None:
        if not self.enabled or not artist.strip() or not title.strip():
            return None
        params = {"artist": artist, "title": title, "type": "release", "per_page": "5"}
        if catalog_no:
            params["catno"] = catalog_no
        if barcode:
            params["barcode"] = barcode
        try:
            search = self._get("/database/search", params)
            result = next((item for item in search.get("results") or [] if item.get("id")), None)
            if not result:
                return None
            payload = self._get(f"/releases/{result['id']}")
            enriched = self._release_payload(payload)
            if enriched:
                enriched["isrc"] = isrc
                self._record_brain(enriched)
            return enriched
        except DiscogsAgentError:
            return None
