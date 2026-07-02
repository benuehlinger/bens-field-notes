#!/usr/bin/env python3
"""
Aggregate ABS-EE autoloan data into a compact dashboard parquet.

Reads directly from R2 via the S3-compatible API using DuckDB's httpfs
extension. Queries year-by-year (and month-by-month for 2019) to avoid
union_by_name schema conflicts in the full 24K-file dataset.

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
import pandas as pd

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY = os.environ.get("R2_ACCESS_KEY_ID", "")
R2_SECRET_KEY = os.environ.get("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET = os.environ.get("R2_BUCKET", "lending-data-lake")
OUTPUT = Path(__file__).parent / "outputs" / "abs_ee_dashboard.parquet"

if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY]):
    print("ERROR: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY must be set", file=sys.stderr)
    print("  Copy them from bens-data-lake/pipelines/.env", file=sys.stderr)
    sys.exit(1)

# 2019-03 contains schema-deficient files that trigger TProtocolException under
# union_by_name. Per per-month diagnostic (2026-06-10) all other months are clean.
SKIP_PERIODS = {"2019-03"}

DPD_QUERY = """
    SELECT
        filing_date,
        COUNT(*)                                                          AS total_loans,
        COUNT(currentDelinquencyStatus)                                   AS loans_with_status,
        COUNT(*) FILTER (WHERE currentDelinquencyStatus >= 30) * 100.0
            / NULLIF(COUNT(currentDelinquencyStatus), 0)                  AS d30_rate,
        COUNT(*) FILTER (WHERE currentDelinquencyStatus >= 60) * 100.0
            / NULLIF(COUNT(currentDelinquencyStatus), 0)                  AS d60_rate,
        COUNT(*) FILTER (WHERE currentDelinquencyStatus >= 90) * 100.0
            / NULLIF(COUNT(currentDelinquencyStatus), 0)                  AS d90_rate
    FROM read_parquet(
        's3://{bucket}/abs_ee/curated/asset_class=autoloan/reporting_period={period}/**/*.parquet',
        union_by_name=true,
        hive_partitioning=false
    )
    WHERE filing_date IS NOT NULL
    GROUP BY filing_date
    ORDER BY filing_date
"""


def make_con():
    con = duckdb.connect()
    con.execute(f"""
        INSTALL httpfs; LOAD httpfs;
        SET s3_region = 'auto';
        SET s3_endpoint = '{R2_ACCOUNT_ID}.r2.cloudflarestorage.com';
        SET s3_access_key_id = '{R2_ACCESS_KEY}';
        SET s3_secret_access_key = '{R2_SECRET_KEY}';
    """)
    return con


def query_period(period: str) -> pd.DataFrame | None:
    """Run the DPD aggregation for one reporting_period glob (e.g. '2020-*' or '2019-01')."""
    con = make_con()
    try:
        return con.execute(DPD_QUERY.format(bucket=R2_BUCKET, period=period)).df()
    except Exception as e:
        print(f"  ✗ {period}: {e}")
        return None
    finally:
        con.close()


def main() -> None:
    print("Connecting to R2 via S3 API...")
    years = [str(y) for y in range(2017, 2027)]
    frames = []

    for year in years:
        if year == "2019":
            # 2019-03 has schema-deficient files — handle month by month
            months = [f"2019-{m:02d}" for m in range(1, 13)]
            for month in months:
                if month in SKIP_PERIODS:
                    print(f"  ⊘ {month}: skipped (schema-deficient files, no DPD data loss)")
                    continue
                df = query_period(month)
                if df is not None and len(df):
                    frames.append(df)
                    print(f"  ✓ {month}: {len(df)} filing dates")
        else:
            df = query_period(f"{year}-*")
            if df is not None and len(df):
                frames.append(df)
                print(f"  ✓ {year}: {len(df)} filing dates")

    if not frames:
        print("ERROR: no data returned", file=sys.stderr)
        sys.exit(1)

    df = pd.concat(frames).sort_values("filing_date").reset_index(drop=True)

    # Deduplicate in case filing_date appears in multiple reporting_periods
    df = df.groupby("filing_date", as_index=False).agg({
        "total_loans":      "sum",
        "loans_with_status": "sum",
        "d30_rate":         "mean",
        "d60_rate":         "mean",
        "d90_rate":         "mean",
    })

    for col in ["d30_rate", "d60_rate", "d90_rate"]:
        df[col] = df[col].round(3)

    df["status_pct"] = (df["loans_with_status"] / df["total_loans"] * 100).round(1)

    print(f"\n{'filing_date':<14} {'total_loans':>12} {'status%':>8} {'d30':>6} {'d60':>6} {'d90':>6}")
    print("-" * 60)
    for _, row in df.iterrows():
        flag = " ⚠" if row["status_pct"] < 80 else ""
        print(
            f"{row['filing_date']:<14} {int(row['total_loans']):>12,} "
            f"{row['status_pct']:>7.1f}% "
            f"{row['d30_rate']:>6.2f} {row['d60_rate']:>6.2f} {row['d90_rate']:>6.2f}{flag}"
        )

    low = df[df["status_pct"] < 80]
    if len(low):
        print(f"\n⚠  {len(low)} months below 80% DPD coverage")
    else:
        print(f"\n✓ All {len(df)} months at 80%+ DPD coverage")

    OUTPUT.parent.mkdir(exist_ok=True)
    df.drop(columns=["status_pct"]).to_parquet(OUTPUT, index=False)
    print(f"✓ {len(df)} months → {OUTPUT.relative_to(Path.cwd())}")


if __name__ == "__main__":
    main()
