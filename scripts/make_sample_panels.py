#!/usr/bin/env python3
"""
Generate SYNTHETIC sample data for the two desk panels we haven't yet ingested
into the data lake (Private Credit, AI). Deterministic (seeded) so rebuilds are
stable. These are clearly labeled "sample / illustrative" on the site — they are
NOT real analysis and must not be presented as such.

Output:
    analysis/outputs/private_credit_sample.parquet   (monthly non-accrual rate)
    analysis/outputs/ai_sample.parquet                (monthly share of AI pilots
                                                        with measurable ROI)
"""
from pathlib import Path

import numpy as np
import pandas as pd

OUT = Path(__file__).parent.parent / "analysis" / "outputs"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(42)


def _series(trend, sigma, lo, hi, smooth=3):
    """A noisy trend that stays near `trend` (endpoint included), lightly smoothed."""
    n = len(trend)
    raw = trend + rng.normal(0, sigma, n)
    s = pd.Series(raw).rolling(smooth, min_periods=1, center=True).mean().to_numpy()
    return np.clip(s, lo, hi)


# ── Private Credit: direct-lending non-accrual rate, % (rising off a low base) ──
pc_months = pd.date_range("2021-01-01", "2026-04-01", freq="MS")
pc_val = _series(np.linspace(0.8, 2.6, len(pc_months)), 0.12, 0.3, 4.0)
pd.DataFrame({"date": pc_months, "value": np.round(pc_val, 2)}).to_parquet(
    OUT / "private_credit_sample.parquet", index=False
)

# ── AI: share of enterprise AI pilots with measurable P&L impact, % (the trough) ──
ai_months = pd.date_range("2023-06-01", "2026-04-01", freq="MS")
ai_val = _series(np.linspace(3.0, 14.0, len(ai_months)), 0.9, 1.0, 40.0)
pd.DataFrame({"date": ai_months, "value": np.round(ai_val, 1)}).to_parquet(
    OUT / "ai_sample.parquet", index=False
)

# ── Productivity J-curve thesis indicators (illustrative, quarterly) ──
# Structured to mirror the real series: Census BTOS AI adoption, BEA IT/software
# investment, BLS nonfarm output/hour, SF Fed utilization-adjusted TFP. The
# "adjusted" line illustrates the Brynjolfsson intangibles-mismeasurement idea.
jq = pd.date_range("2015-03-01", "2026-06-01", freq="QS")
yrs = np.array([(d - pd.Timestamp("2015-01-01")).days / 365.25 for d in jq])
post = np.clip(yrs - 7.5, 0, None)   # acceleration after ~mid-2022


def _n(sig):
    return rng.normal(0, sig, len(jq))


jcurve = pd.DataFrame({
    "date": jq,
    "adoption":         np.round(4.0 + 0.12 * yrs + 1.55 * post + _n(0.2), 2),   # % of firms
    "it_investment":    np.round(100 + 5.2 * yrs + 3.6 * post + _n(1.0), 1),     # index 2015=100
    "productivity":     np.round(100 + 1.05 * yrs + _n(0.4), 1),                 # index 2015=100 (flat-ish)
    "tfp":              np.round(100 + 0.42 * yrs + _n(0.4), 1),                 # index 2015=100
})
jcurve["productivity_adj"] = np.round(jcurve["productivity"] + 1.25 * post + _n(0.2), 1)
jcurve.to_parquet(OUT / "jcurve_sample.parquet", index=False)

print(f"✓ private_credit_sample.parquet ({len(pc_months)} months) — latest {pc_val[-1]:.2f}%")
print(f"✓ ai_sample.parquet ({len(ai_months)} months) — latest {ai_val[-1]:.1f}%")
print(f"✓ jcurve_sample.parquet ({len(jq)} quarters) — adoption {jcurve['adoption'].iloc[-1]:.1f}%, "
      f"productivity idx {jcurve['productivity'].iloc[-1]:.1f}")
