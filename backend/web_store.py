import hashlib
import sqlite3
import time
from pathlib import Path


class WebStore:
    def __init__(self, path: Path):
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY, owner TEXT NOT NULL,
                    created_at REAL NOT NULL, expires_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS jobs (
                    id TEXT PRIMARY KEY, owner TEXT NOT NULL, status TEXT NOT NULL,
                    source_url TEXT NOT NULL, format TEXT NOT NULL, quality TEXT NOT NULL,
                    created_at REAL NOT NULL, updated_at REAL NOT NULL, expires_at REAL NOT NULL,
                    title TEXT, filename TEXT, file_path TEXT, size INTEGER, error TEXT
                );
                CREATE INDEX IF NOT EXISTS jobs_owner_id ON jobs(owner, id);
                CREATE TABLE IF NOT EXISTS login_attempts (
                    client_key TEXT NOT NULL, attempted_at REAL NOT NULL
                );
                CREATE INDEX IF NOT EXISTS login_attempts_key_time
                    ON login_attempts(client_key, attempted_at);
            """)

    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        return db

    @staticmethod
    def token_hash(token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def create_session(self, token: str, owner: str, ttl: int):
        now = time.time()
        with self.connect() as db:
            db.execute("INSERT INTO sessions VALUES (?, ?, ?, ?)", (self.token_hash(token), owner, now, now + ttl))

    def session_owner(self, token: str) -> str | None:
        now = time.time()
        with self.connect() as db:
            row = db.execute("SELECT owner FROM sessions WHERE token_hash=? AND expires_at>?", (self.token_hash(token), now)).fetchone()
        return row["owner"] if row else None

    def delete_session(self, token: str):
        with self.connect() as db:
            db.execute("DELETE FROM sessions WHERE token_hash=?", (self.token_hash(token),))

    def create_job(self, job_id: str, owner: str, url: str, fmt: str, quality: str, ttl: int):
        now = time.time()
        with self.connect() as db:
            db.execute("INSERT INTO jobs(id,owner,status,source_url,format,quality,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)", (job_id, owner, "queued", url, fmt, quality, now, now, now + ttl))

    def create_job_if_capacity(self, job_id: str, owner: str, url: str, fmt: str, quality: str, ttl: int, capacity: int) -> bool:
        now = time.time()
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            active = db.execute("SELECT COUNT(*) FROM jobs WHERE status IN ('queued','downloading')").fetchone()[0]
            if active >= capacity:
                return False
            db.execute("INSERT INTO jobs(id,owner,status,source_url,format,quality,created_at,updated_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)", (job_id, owner, "queued", url, fmt, quality, now, now, now + ttl))
        return True

    def update_job(self, job_id: str, **values):
        values["updated_at"] = time.time()
        columns = ",".join(f"{key}=?" for key in values)
        with self.connect() as db:
            db.execute(f"UPDATE jobs SET {columns} WHERE id=?", (*values.values(), job_id))

    def get_job(self, job_id: str, owner: str):
        with self.connect() as db:
            return db.execute("SELECT * FROM jobs WHERE id=? AND owner=?", (job_id, owner)).fetchone()

    def active_count(self) -> int:
        with self.connect() as db:
            return db.execute("SELECT COUNT(*) FROM jobs WHERE status IN ('queued','downloading')").fetchone()[0]

    def expired_artifacts(self):
        with self.connect() as db:
            return db.execute("SELECT id,file_path FROM jobs WHERE expires_at<=?", (time.time(),)).fetchall()

    def interrupt_active_jobs(self, ttl: int) -> int:
        now = time.time()
        with self.connect() as db:
            cursor = db.execute(
                "UPDATE jobs SET status='error', error='Download interrupted', updated_at=?, expires_at=MIN(expires_at, ?) WHERE status IN ('queued','downloading')",
                (now, now + ttl),
            )
        return cursor.rowcount

    def allow_login_attempt(self, client_key: str, limit: int, window: int) -> bool:
        now = time.time()
        cutoff = now - window
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("DELETE FROM login_attempts WHERE attempted_at<=?", (cutoff,))
            count = db.execute("SELECT COUNT(*) FROM login_attempts WHERE client_key=?", (client_key,)).fetchone()[0]
            if count >= limit:
                return False
            db.execute("INSERT INTO login_attempts(client_key,attempted_at) VALUES(?,?)", (client_key, now))
        return True

    def clear_login_attempts(self, client_key: str) -> None:
        with self.connect() as db:
            db.execute("DELETE FROM login_attempts WHERE client_key=?", (client_key,))

    def delete_expired(self):
        now = time.time()
        with self.connect() as db:
            db.execute("DELETE FROM sessions WHERE expires_at<=?", (now,))
            db.execute("DELETE FROM jobs WHERE expires_at<=?", (now,))
