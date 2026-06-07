"""
Lake inventory for the source-material post.

Outputs:
  - outputs/lake_coverage.parquet  — trust_count & file_count per (asset_class, reporting_period)
"""

from pathlib import Path
import pandas as pd
from _db import connect

OUTPUTS = Path(__file__).parent / "outputs"
BUCKET = "lending-data-lake"
ASSETS = ["autoloan", "autolease", "cmbs"]


def main():
    con = connect()
    OUTPUTS.mkdir(exist_ok=True)

    rows = []
    for asset in ASSETS:
        print(f"Globbing {asset}...")
        paths = con.execute(
            f"SELECT * FROM glob('s3://{BUCKET}/abs_ee/curated/asset_class={asset}/**')"
        ).fetchall()
        for (path,) in paths:
            if "reporting_period=" not in path:
                continue
            period = path.split("reporting_period=")[1].split("/")[0]
            cik = path.split("cik=")[1].split("/")[0] if "cik=" in path else "unknown"
            rows.append({"asset_class": asset, "reporting_period": period, "cik": cik})

    df = pd.DataFrame(rows)
    coverage = (
        df.groupby(["asset_class", "reporting_period"])
        .agg(trust_count=("cik", "nunique"), file_count=("cik", "count"))
        .reset_index()
        .sort_values(["asset_class", "reporting_period"])
    )
    coverage.to_parquet(OUTPUTS / "lake_coverage.parquet", index=False)
    print(f"\nSaved lake_coverage.parquet — {len(coverage)} rows")
    print(coverage.groupby("asset_class").agg(
        periods=("reporting_period", "count"),
        max_trusts=("trust_count", "max"),
        total_files=("file_count", "sum"),
    ))


if __name__ == "__main__":
    main()
