#!/usr/bin/env python3
"""
Turn the raw NDFI panel into the two analysis-ready tables the article charts read:

  1. ndfi_aggregate_series.parquet  — the MARKET lens: NDFI total, growth, and
     concentration (top-10 share, >$100B-bank share) by quarter.
  2. ndfi_bank_ranking.parquet      — the COMPANY lens: the biggest NDFI lenders
     ranked, with NDFI/Tier1 concentration and the two case-study banks flagged.

Reads:  analysis/outputs/call_report_ndfi_panel.parquet
Usage:  .venv/bin/python3 analysis/aggregate_ndfi.py
"""

from pathlib import Path

import pandas as pd

OUTDIR = Path(__file__).parent / "outputs"
PANEL = OUTDIR / "call_report_ndfi_panel.parquet"

CERT_FCNCA = 11063  # First-Citizens Bank & Trust
CERT_TFC = 9846     # Truist Bank


def main() -> None:
    df = pd.read_parquet(PANEL)

    # ---- 1. MARKET lens: aggregate by quarter -----------------------------------
    def by_quarter(g: pd.DataFrame) -> pd.Series:
        total = g["LNNDEPC"].sum()
        top10 = g.nlargest(10, "LNNDEPC")["LNNDEPC"].sum()
        big = g.loc[g["ASSET"] >= 100_000_000, "LNNDEPC"].sum()  # >$100B banks
        return pd.Series({
            "ndfi_total_bn": total / 1e6,          # $000s -> $bn
            "n_reporters": len(g),
            "top10_share": top10 / total,
            "big_bank_share": big / total,
        })

    agg = df.groupby("quarter", as_index=False).apply(by_quarter, include_groups=False)
    agg["source_url"] = "https://api.fdic.gov/banks/financials"
    agg["basis"] = "bank-level FDIC Call Report; NDFI reporters (>$10B banks)"
    agg.to_parquet(OUTDIR / "ndfi_aggregate_series.parquet", index=False)

    # ---- 2. COMPANY lens: latest-quarter ranking --------------------------------
    latest = df["quarter"].max()
    cur = df[df["quarter"] == latest].copy()
    rank = cur.nlargest(25, "LNNDEPC").copy()
    rank["ndfi_bn"] = rank["LNNDEPC"] / 1e6
    rank["tier1_bn"] = rank["RBCT1J"] / 1e6
    rank["label"] = rank["NAMEHCR"].str.title().fillna(rank["NAME"].str.title())
    rank["is_example"] = rank["CERT"].isin([CERT_FCNCA, CERT_TFC])
    rank = rank[[
        "CERT", "label", "quarter", "ndfi_bn", "tier1_bn",
        "ndfi_to_tier1", "ndfi_to_loans", "ndfi_to_assets", "is_example",
    ]].sort_values("ndfi_to_tier1", ascending=False)
    rank.to_parquet(OUTDIR / "ndfi_bank_ranking.parquet", index=False)

    # ---- console summary (sanity-check against the article's figures) -----------
    last = agg.iloc[-1]
    print(f"MARKET  {latest.date()}:  NDFI ${last.ndfi_total_bn:,.0f}B   "
          f"top10={last.top10_share:.0%}   >$100B={last.big_bank_share:.0%}   "
          f"n={int(last.n_reporters)}")
    print("COMPANY  most concentrated (NDFI / Tier 1):")
    for _, r in rank.head(8).iterrows():
        flag = "  <-- case study" if r.is_example else ""
        print(f"  {r.label:32.32}  NDFI ${r.ndfi_bn:6.1f}B   {r.ndfi_to_tier1:5.0%} of Tier1{flag}")
    fc = rank[rank.CERT == CERT_FCNCA]
    tf = rank[rank.CERT == CERT_TFC]
    if len(fc): print(f"  check FCNCA: NDFI ${fc.ndfi_bn.iloc[0]:.1f}B, {fc.ndfi_to_loans.iloc[0]:.0%} of loans")
    if len(tf): print(f"  check TFC:   NDFI ${tf.ndfi_bn.iloc[0]:.1f}B, {tf.ndfi_to_loans.iloc[0]:.0%} of loans, {tf.ndfi_to_tier1.iloc[0]:.0%} of Tier1")


if __name__ == "__main__":
    main()
