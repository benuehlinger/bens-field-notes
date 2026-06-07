"""
FICO, LTV, and credit tier aggregates for the ABS-EE autoloan universe.
Writes outputs/ Parquet files consumed by the fico-credit-quality post.

  cd bens-field-notes
  source .venv/bin/activate   # or: pip install duckdb pandas python-dotenv pyarrow
  python analysis/fico_credit_quality.py
  python analysis/fico_credit_quality.py --period 2025-12
"""

from __future__ import annotations

import argparse
from pathlib import Path

from _db import connect, autoloan_path

OUTPUTS = Path(__file__).parent / "outputs"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--period", default="2026-04", help="YYYY-MM reporting period")
    args = ap.parse_args()

    period = args.period
    glob = autoloan_path(period=period)
    READ = f"read_parquet('{glob}', union_by_name=true)"

    con = connect()
    OUTPUTS.mkdir(exist_ok=True)

    FICO_EXPR = "TRY_CAST(obligorCreditScore AS DOUBLE)"
    LTV_EXPR  = "CASE WHEN vehicleValueAmount > 0 THEN originalLoanAmount / vehicleValueAmount END"

    # ── By deal ──────────────────────────────────────────────────
    print(f"[{period}] aggregating by deal...")
    by_deal = con.execute(f"""
        SELECT
            trust_cik,
            trust_name,
            sponsor,
            count(*)                                                        AS loan_count,
            round(sum(originalLoanAmount) / 1e6, 1)                        AS orig_bal_mm,
            round(avg({FICO_EXPR}), 1)                                      AS avg_fico,
            round(percentile_cont(0.50) WITHIN GROUP (ORDER BY {FICO_EXPR}), 1) AS median_fico,
            round(percentile_cont(0.25) WITHIN GROUP (ORDER BY {FICO_EXPR}), 1) AS p25_fico,
            round(percentile_cont(0.75) WITHIN GROUP (ORDER BY {FICO_EXPR}), 1) AS p75_fico,
            round(avg({LTV_EXPR}), 4)                                       AS avg_ltv,
            count(*) FILTER (WHERE {FICO_EXPR} IS NULL)                    AS loans_no_fico
        FROM {READ}
        WHERE {FICO_EXPR} IS NOT NULL
        GROUP BY 1, 2, 3
        ORDER BY loan_count DESC
    """).fetchdf()
    by_deal["period"] = period
    out = OUTPUTS / f"fico_by_deal_{period}.parquet"
    by_deal.to_parquet(out, index=False)
    print(f"  → {out}  ({len(by_deal)} rows)")

    # ── By vehicle make ──────────────────────────────────────────
    print(f"[{period}] aggregating by vehicle make...")
    by_make = con.execute(f"""
        SELECT
            UPPER(TRIM(vehicleManufacturerName))                            AS make,
            vehicleNewUsedCode                                              AS new_used,
            count(*)                                                        AS loan_count,
            round(avg({FICO_EXPR}), 1)                                      AS avg_fico,
            round(percentile_cont(0.50) WITHIN GROUP (ORDER BY {FICO_EXPR}), 1) AS median_fico,
            round(avg({LTV_EXPR}), 4)                                       AS avg_ltv,
            round(avg(originalLoanAmount), 0)                              AS avg_loan_size
        FROM {READ}
        WHERE {FICO_EXPR} IS NOT NULL
            AND vehicleManufacturerName IS NOT NULL
        GROUP BY 1, 2
        ORDER BY loan_count DESC
    """).fetchdf()
    by_make["period"] = period
    out = OUTPUTS / f"fico_by_make_{period}.parquet"
    by_make.to_parquet(out, index=False)
    print(f"  → {out}  ({len(by_make)} rows)")

    # ── By credit tier ───────────────────────────────────────────
    print(f"[{period}] aggregating by credit tier...")
    by_tier = con.execute(f"""
        SELECT
            CASE
                WHEN {FICO_EXPR} >= 750 THEN '750+  Prime+'
                WHEN {FICO_EXPR} >= 700 THEN '700-749  Prime'
                WHEN {FICO_EXPR} >= 660 THEN '660-699  Near-Prime'
                WHEN {FICO_EXPR} >= 620 THEN '620-659  Subprime'
                ELSE                        '<620  Deep Sub'
            END                                                             AS tier,
            vehicleNewUsedCode                                              AS new_used,
            count(*)                                                        AS loan_count,
            round(sum(originalLoanAmount) / 1e6, 1)                        AS orig_bal_mm,
            round(avg(originalLoanAmount), 0)                              AS avg_loan_size,
            round(avg(originalLoanTerm), 1)                                AS avg_term_mo,
            round(avg({LTV_EXPR}), 4)                                       AS avg_ltv
        FROM {READ}
        WHERE {FICO_EXPR} IS NOT NULL
        GROUP BY 1, 2
        ORDER BY tier, new_used
    """).fetchdf()
    by_tier["period"] = period
    out = OUTPUTS / f"fico_by_tier_{period}.parquet"
    by_tier.to_parquet(out, index=False)
    print(f"  → {out}  ({len(by_tier)} rows)")

    # ── FICO distribution by top sponsor ─────────────────────────
    print(f"[{period}] computing FICO distribution by top sponsors...")
    import re as _re

    def _shorten(name: str) -> str:
        name = _re.sub(r"\s+(Auto\s+)?Receivables.*$", "", name, flags=_re.I)
        name = _re.sub(r"\s+(Vehicle\s+)?Owner.*$", "", name, flags=_re.I)
        name = _re.sub(r"\s+Auto\s+Securitization.*$", "", name, flags=_re.I)
        name = _re.sub(r"\s+Lending\s*$", "", name, flags=_re.I)
        name = _re.sub(r"\s+Automobile\s*$", "", name, flags=_re.I)
        name = _re.sub(r"\s+(Enhanced|Prime|Auto|Loan)\s*$", "", name, flags=_re.I)
        return name.strip()

    top_sponsors = (
        by_deal.drop_duplicates("sponsor").nlargest(10, "loan_count")["sponsor"]
        .dropna().tolist()
    )
    sponsor_filter = ", ".join("'{}'".format(s.replace("'", "''")) for s in top_sponsors)
    fico_dist = con.execute(f"""
        SELECT
            sponsor,
            FLOOR({FICO_EXPR} / 20) * 20   AS fico_bin,
            COUNT(*)                        AS n
        FROM {READ}
        WHERE {FICO_EXPR} IS NOT NULL
          AND {FICO_EXPR} >= 300
          AND sponsor IN ({sponsor_filter})
        GROUP BY 1, 2
        ORDER BY sponsor, fico_bin
    """).fetchdf()
    sponsor_median = by_deal.groupby("sponsor")["median_fico"].mean().reset_index()
    fico_dist = fico_dist.merge(sponsor_median, on="sponsor", how="left")
    fico_dist["density"] = fico_dist.groupby("sponsor")["n"].transform(
        lambda x: x / x.sum()
    )
    fico_dist["short_name"] = fico_dist["sponsor"].apply(_shorten)
    fico_dist["period"] = period
    out = OUTPUTS / f"fico_dist_sponsor_{period}.parquet"
    fico_dist.to_parquet(out, index=False)
    print(f"  → {out}  ({len(fico_dist)} rows)")

    # Quick preview
    print(f"\n── Credit tier mix ──")
    print(by_tier[["tier", "new_used", "loan_count", "orig_bal_mm", "avg_ltv"]].to_string(index=False))
    print(f"\n── Top 10 deals by median FICO ──")
    print(by_deal.head(10)[["sponsor", "loan_count", "median_fico", "p25_fico", "p75_fico", "avg_ltv"]].to_string(index=False))
    print("\nDone.")


if __name__ == "__main__":
    main()
