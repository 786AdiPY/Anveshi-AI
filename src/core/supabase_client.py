"""
Pramaan AI — Supabase persistence client.

Lazily creates a single Supabase client from SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
Returns None when either is unset so the API keeps working against the
in-memory store alone in local dev — persistence is additive, not required.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

from ..logger import setup_logger

logger = setup_logger()

RESEARCH_RUNS_TABLE = "research_runs"


@lru_cache(maxsize=1)
def get_supabase():
    """Return a cached Supabase client, or None if not configured."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        logger.info("Supabase not configured (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY unset) — persistence disabled")
        return None

    try:
        from supabase import create_client
    except ImportError:
        logger.warning("supabase package not installed — run `pip install supabase` to enable persistence")
        return None

    try:
        client = create_client(url, key)
        logger.info("Supabase client initialized")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def is_configured() -> bool:
    return get_supabase() is not None
