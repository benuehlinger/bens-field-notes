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

print(f"✓ private_credit_sample.parquet ({len(pc_months)} months) — latest {pc_val[-1]:.2f}%")
print(f"✓ ai_sample.parquet ({len(ai_months)} months) — latest {ai_val[-1]:.1f}%")
