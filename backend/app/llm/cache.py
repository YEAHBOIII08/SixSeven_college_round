"""Persistent LLM Response Cache (PRD & Deterministic Engine).

Caches model completions keyed by hash(model, prompt_or_messages, temperature, seed).
Ensures replay commands can reproduce identical responses without network calls or nondeterminism.
"""

import hashlib
import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from app.core.config import settings

_DB_PATH = Path("agentbreak.db").resolve()
_lock = threading.Lock()
_memory_cache: Dict[str, str] = {}


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_PATH), timeout=30.0)
    conn.execute(
        """CREATE TABLE IF NOT EXISTS llm_response_cache (
            cache_key TEXT PRIMARY KEY,
            model TEXT NOT NULL,
            prompt TEXT NOT NULL,
            response_text TEXT NOT NULL,
            temperature REAL NOT NULL,
            seed INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )"""
    )
    conn.execute(
        "CREATE INDEX IF NOT EXISTS ix_llm_cache_model ON llm_response_cache(model)"
    )
    return conn


class LLMResponseCache:
    """Thread-safe persistent cache for LLM responses."""

    def __init__(self):
        with _lock:
            try:
                with _get_connection() as conn:
                    conn.commit()
            except Exception:
                pass

    @staticmethod
    def compute_key(
        model: str,
        messages: Any,
        temperature: float = 0.0,
        seed: int = 42,
    ) -> str:
        """Compute deterministic SHA-256 cache key."""
        if isinstance(messages, (dict, list)):
            serialized = json.dumps(messages, sort_keys=True, ensure_ascii=False)
        else:
            serialized = str(messages).strip()

        payload = f"{model.strip()}||{serialized}||{float(temperature):.2f}||{int(seed)}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def get(
        self,
        model: str,
        messages: Any,
        temperature: float = 0.0,
        seed: int = 42,
    ) -> Optional[str]:
        """Lookup cached completion."""
        key = self.compute_key(model, messages, temperature, seed)
        with _lock:
            if key in _memory_cache:
                return _memory_cache[key]

            try:
                with _get_connection() as conn:
                    row = conn.execute(
                        "SELECT response_text FROM llm_response_cache WHERE cache_key = ?",
                        (key,),
                    ).fetchone()
                    if row:
                        _memory_cache[key] = row[0]
                        return row[0]
            except Exception:
                pass
        return None

    def set(
        self,
        model: str,
        messages: Any,
        response_text: str,
        temperature: float = 0.0,
        seed: int = 42,
    ) -> None:
        """Store completion in cache."""
        key = self.compute_key(model, messages, temperature, seed)
        now_iso = datetime.now(timezone.utc).isoformat()
        prompt_str = (
            json.dumps(messages, sort_keys=True)
            if isinstance(messages, (dict, list))
            else str(messages)
        )

        with _lock:
            _memory_cache[key] = response_text
            try:
                with _get_connection() as conn:
                    conn.execute(
                        """INSERT OR REPLACE INTO llm_response_cache 
                        (cache_key, model, prompt, response_text, temperature, seed, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)""",
                        (key, model, prompt_str, response_text, temperature, seed, now_iso),
                    )
                    conn.commit()
            except Exception:
                pass

    def count(self) -> int:
        """Total cached entries."""
        with _lock:
            try:
                with _get_connection() as conn:
                    row = conn.execute("SELECT COUNT(*) FROM llm_response_cache").fetchone()
                    return row[0] if row else 0
            except Exception:
                return len(_memory_cache)


llm_cache = LLMResponseCache()
