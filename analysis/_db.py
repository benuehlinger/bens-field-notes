"""
DuckDB + R2 connection helper for field-notes analysis scripts.

Looks for credentials in (in order):
  1. bens-field-notes/.env
  2. ../bens-data-lake/pipelines/.env  (sibling repo on same machine)
"""

from __future__ import annotations

import os
from pathlib import Path

_HERE = Path(__file__).resolve().parent


def _load_env() -> None:
    from dotenv import load_dotenv
    local = _HERE.parent / ".env"
    sibling = _HERE.parent.parent / "bens-data-lake" / "pipelines" / ".env"
    if local.exists():
        load_dotenv(local)
    elif sibling.exists():
        load_dotenv(sibling)


def connect():
    """Return a DuckDB connection pre-configured for R2."""
    _load_env()
    import duckdb
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    endpoint = os.environ["R2_ENDPOINT_URL"].replace("https://", "")
    con.execute(f"""
        SET s3_endpoint          = '{endpoint}';
        SET s3_access_key_id     = '{os.environ["R2_ACCESS_KEY_ID"]}';
        SET s3_secret_access_key = '{os.environ["R2_SECRET_ACCESS_KEY"]}';
        SET s3_region    = 'auto';
        SET s3_use_ssl   = true;
        SET s3_url_style = 'path';
    """)
    return con


def autoloan_path(period: str = "*", cik: str = "*") -> str:
    _load_env()
    bucket = os.environ["R2_BUCKET"]
    return (
        f"s3://{bucket}/abs_ee/curated/asset_class=autoloan/"
        f"reporting_period={period}/cik={cik}/accession=*/loans.parquet"
    )
