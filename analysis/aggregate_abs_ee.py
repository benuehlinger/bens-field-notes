#!/usr/bin/env python3
"""
Aggregate ABS-EE autoloan data into a compact dashboard parquet.

Reads directly from R2 via the S3-compatible API using DuckDB's httpfs
extension. Native S3 glob expansion is fast even across 24K parquet files.

Usage:
    python analysis/aggregate_abs_ee.py

Env (all required — copy from bens-data-lake/pipelines/.env):
    R2_ACCOUNT_ID
    R2_ACCESS_KEY_ID
    R2_SECRET_ACCESS_KEY
    R2_BUCKET           (default: lending-data-lake)

Output:
    analysis/outputs/abs_ee_dashboard.parquet
"""

import os
import sys
from pathlib import Path

import duckdb

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "lending-data-lake")
OUTPUT = Path(__file__).parent / "outputs" / "abs_ee_dashboard.parquet"

if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY]):
    print("ERROR: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY must be set", file=sys.stderr)
    print("  Copy them from bens-data-lake/pipelines/.env", file=sys.stderr)
    sys.exit(1)


def main() -> None:
    print("Connecting to R2 via S3 API...")
    con = duckdb.connect()
    con.execute(f"""
        INSTALL httpfs; LOAD httpfs;
        SET s3_region = 'auto';
        SET s3_endpoint = '{R2_ACCOUNT_ID}.r2.cloudflarestorage.com';
        SET s3_access_key_id = '{R2_ACCESS_KEY}';
        SET s3_secret_access_key = '{R2_SECRET_KEY}';
    """)

    print("Scanning autoloan parquet files (this takes ~30s on first run)...")
    df = con.execute(f"""
        SELECT
            filing_date,
            COUNT(*) FILTER (WHERE days_past_due >= 30) * 100.0 / COUNT(*) AS d30_rate,
            COUNT(*) FILTER (WHERE days_past_due >= 60) * 100.0 / COUNT(*) AS d60_rate,
            COUNT(*) FILTER (WHERE days_past_due >= 90) * 100.0 / COUNT(*) AS d90_rate,
            COUNT(*) AS total_loans
        FROM read_parquet(
            's3://{R2_BUCKET}/abs_ee/curated/asset_class=autoloan/**/*.parquet',
            union_by_name=true,
            hive_partitioning=true
        )
        WHERE filing_date IS NOT NULL
          AND days_past_due IS NOT NULL
        GROUP BY filing_date
        ORDER BY filing_date
    """).df()

    # Round rates to 3 decimal places
    for col in ["d30_rate", "d60_rate", "d90_rate"]:
        df[col] = df[col].round(3)

    OUTPUT.parent.mkdir(exist_ok=True)
    df.to_parquet(OUTPUT, index=False)
    print(f"✓ {len(df)} months → {OUTPUT.relative_to(Path.cwd())}")


if __name__ == "__main__":
    main()
