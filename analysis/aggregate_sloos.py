#!/usr/bin/env python3
"""
Aggregate SLOOS Table 1 data into a compact dashboard parquet.

Downloads parquet files from the R2 Worker (no S3 credentials needed),
writes them to a temp dir, then aggregates locally with DuckDB.

Usage:
    python analysis/aggregate_sloos.py

Env:
    R2_BASE_URL  Worker base URL (defaults to production)

Output:
    analysis/outputs/sloos_dashboard.parquet
"""

import json
import os
import sys
import tempfile
from pathlib import Path

import duckdb
import requests

R2_BASE = os.environ.get(
    "R2_BASE_URL",
    "https://bens-field-notes-r2.benuehlinger-dev.workers.dev",
)
OUTPUT = Path(__file__).parent / "outputs" / "sloos_dashboard.parquet"


def main() -> None:
    print("Fetching SLOOS manifest from Worker...")
    resp = requests.get(
        f"{R2_BASE}/_manifest/sloos/curated/source=fed_sloos_table_1/",
        timeout=30,
    )
    resp.raise_for_status()
    manifest = resp.json()

    keys = [k for k in manifest if k.endswith(".parquet")]
    if not keys:
        print("ERROR: no parquet files found in manifest", file=sys.stderr)
        sys.exit(1)

    print(f"Downloading {len(keys)} release files...")
    with tempfile.TemporaryDirectory() as tmpdir:
        local_paths = []
        for key in keys:
            url = f"{R2_BASE}/{key}"
            fname = key.replace("/", "__") + ".parquet"
            dest = Path(tmpdir) / fname
            r = requests.get(url, timeout=60)
            r.raise_for_status()
            dest.write_bytes(r.content)
            local_paths.append(str(dest))

        print(f"Aggregating {len(local_paths)} files locally...")
        con = duckdb.connect()
        path_list = json.dumps(local_paths)

        df = con.execute(f"""
            WITH classified AS (
                SELECT
                    release_code,
                    CASE
                        WHEN context_blob LIKE '%A. Standards for large and middle-market firms%'
                         AND context_blob NOT LIKE '%B. Standards for small firms%'
                         AND context_blob NOT LIKE '%a. Maximum size of credit lines%'
                         THEN 'C&I - Large'
                        WHEN context_blob LIKE '%B. Standards for small firms (annual sales of less than $50 million)%'
                         AND context_blob NOT LIKE '%a. Maximum size of credit lines%'
                         THEN 'C&I - Small'
                        WHEN context_blob LIKE '%credit cards from individuals or households changed%'
                         AND context_blob NOT LIKE '%Credit limits%'
                         THEN 'Consumer - Credit Card'
                        WHEN context_blob LIKE '%and lease financing.)%'
                         AND context_blob NOT LIKE '%Maximum maturity%'
                         THEN 'Consumer - Auto'
                    END AS loan_type,
                    SUM(CASE WHEN response_category IN ('Tightened considerably','Tightened somewhat') THEN value ELSE 0 END)
                      - SUM(CASE WHEN response_category IN ('Eased somewhat','Eased considerably') THEN value ELSE 0 END)
                      AS net_pct_tightening
                FROM read_parquet({path_list}, union_by_name=true)
                WHERE metric = 'percent'
                  AND respondent_segment = 'all_respondents'
                  AND response_category IN (
                      'Tightened considerably','Tightened somewhat',
                      'Eased somewhat','Eased considerably'
                  )
                GROUP BY release_code, loan_type
                HAVING loan_type IS NOT NULL
            )
            SELECT
                strptime(release_code::VARCHAR, '%Y%m') AS survey_date,
                loan_type,
                ROUND(net_pct_tightening, 1) AS net_pct_tightening
            FROM classified
            ORDER BY survey_date, loan_type
        """).df()

    OUTPUT.parent.mkdir(exist_ok=True)
    df.to_parquet(OUTPUT, index=False)

    n_surveys = df["survey_date"].nunique()
    print(f"✓ {len(df)} rows, {n_surveys} surveys → {OUTPUT.relative_to(Path.cwd())}")


if __name__ == "__main__":
    main()
