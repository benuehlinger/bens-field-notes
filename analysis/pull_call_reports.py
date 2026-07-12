#!/usr/bin/env python3
"""
Pull bank-level exposure to non-depository financial institutions (NDFIs) from
the FDIC's public BankFind financials API, and write a tidy panel for the
private-credit-exposure article.

Why this field: `LNNDEPC` is the Call Report line for "loans to nondepository
financial institutions" — the category that captures most bank exposure to
private credit. Banks with >$10B in assets have reported it since 2024-Q4.

Basis (important): BANK level — the chartered depository's Call Report as served
by the FDIC financials feed (RCON/RCFD consolidated). Tier 1 capital = `RBCT1J`.
This is the native level of Whalen's OLL method. The two case-study 10-K figures
are *holding-company* level and are kept in a separate, labeled table — never
divide one basis by the other.

Usage:
    .venv/bin/python3 analysis/pull_call_reports.py

Output:
    analysis/outputs/call_report_ndfi_panel.parquet   (bank x quarter, NDFI reporters)
"""

import json
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

import pandas as pd

API = "https://api.fdic.gov/banks/financials"

# NDFI has been a distinct Call Report line only since 2024-Q4; this is its full history.
QUARTERS = ["20241231", "20250331", "20250630", "20250930", "20251231", "20260331"]

FIELDS = [
    "CERT", "NAME", "NAMEHCR", "STALP", "REPDTE",
    "ASSET",     # total assets ($000s)
    "LNLSNET",   # net loans & leases ($000s)
    "LNNDEPC",   # loans to nondepository financial institutions — NDFI ($000s)
    "RBCT1J",    # tier 1 capital ($000s) — the concentration denominator
    "RWAJT",     # risk-weighted assets ($000s)
    "EQ",        # total equity ($000s)
    "NTLNLSR",   # net charge-offs to loans (%) — overall asset quality
]

OUT = Path(__file__).parent / "outputs" / "call_report_ndfi_panel.parquet"


def pull_quarter(repdte: str) -> list[dict]:
    """Fetch every institution's record for one quarter (one page, ~4,400 banks)."""
    query = urllib.parse.urlencode({
        "filters": f"REPDTE:{repdte}",
        "fields": ",".join(FIELDS),
        "limit": 10000,
        "format": "json",
    })
    with urllib.request.urlopen(f"{API}?{query}", timeout=90) as resp:
        payload = json.load(resp)
    return [d["data"] for d in payload["data"]]


def main() -> None:
    rows: list[dict] = []
    for q in QUARTERS:
        recs = pull_quarter(q)
        # keep only banks that actually report an NDFI balance (the >$10B filers)
        recs = [x for x in recs if x.get("LNNDEPC") not in (None, "")]
        print(f"  {q}: {len(recs)} NDFI reporters")
        rows.extend(recs)

    df = pd.DataFrame(rows)
    df["quarter"] = pd.to_datetime(df["REPDTE"].astype(str), format="%Y%m%d")
    for c in ["ASSET", "LNLSNET", "LNNDEPC", "RBCT1J", "RWAJT", "EQ", "NTLNLSR"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # The metric that matters for solvency: NDFI concentration to Tier 1 capital.
    df["ndfi_to_tier1"] = df["LNNDEPC"] / df["RBCT1J"]
    df["ndfi_to_loans"] = df["LNNDEPC"] / df["LNLSNET"]
    df["ndfi_to_assets"] = df["LNNDEPC"] / df["ASSET"]

    # Provenance travels with the data (this is a public-data brand — sourcing IS the product).
    df["source_url"] = API
    df["basis"] = "bank-level (FDIC financials / Call Report); NDFI=LNNDEPC, Tier1=RBCT1J"
    df["pulled_on"] = date.today().isoformat()

    df = df.sort_values(["quarter", "LNNDEPC"], ascending=[True, False])
    OUT.parent.mkdir(exist_ok=True)
    df.to_parquet(OUT, index=False)

    latest = df["quarter"].max()
    n_latest = int((df["quarter"] == latest).sum())
    print(
        f"✓ {len(df)} rows, {df['quarter'].nunique()} quarters, "
        f"{n_latest} banks in {latest.date()} → {OUT.relative_to(Path.cwd())}"
    )


if __name__ == "__main__":
    main()
