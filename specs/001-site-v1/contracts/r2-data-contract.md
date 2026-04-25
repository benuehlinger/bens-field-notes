# R2 Data Contract

**Version**: 1.0 | **Owner**: bens-data-lake pipelines | **Consumer**: bens-field-notes site

This contract defines the interface between the data lake (Cloudflare R2 Parquet files)
and the site's browser-side chart cells. Any change to file paths, column names, or
data types on the lake side MUST be coordinated with this contract.

---

## Bucket Access

| Property | Value |
|---|---|
| Bucket | Set in `R2_BUCKET` env var |
| Access | Public read (no auth required) |
| Base URL (dev) | `https://<bucket>.r2.dev` |
| Base URL (prod) | Configure in `_quarto.yml` as `r2-base-url` site param |

All chart cells access R2 via the site parameter:
```js
// In _quarto.yml params:
// r2-base-url: "https://your-bucket.r2.dev"

// In {ojs} cells:
r2 = params["r2-base-url"]
data = db.query(`SELECT * FROM read_parquet('${r2}/abs_ee/curated/asset_class=autoloan/*.parquet')`)
```

---

## Dataset: ABS-EE Autoloan Panel

**Source ID**: `abs_ee_autoloan`
**R2 Prefix**: `abs_ee/curated/asset_class=autoloan/`
**Partition keys**: Hive-style by filing month

| Column | Type | Description |
|---|---|---|
| `filing_date` | date | SEC EDGAR filing date |
| `asset_class` | string | Always `autoloan` in this partition |
| `loan_id` | string | Anonymized loan identifier |
| `origination_date` | date | Loan origination date |
| `current_balance` | float | Outstanding principal balance (USD) |
| `days_past_due` | int | Days past due at reporting date |
| `delinquency_status` | string | `current`, `30-59`, `60-89`, `90+`, `default` |
| `loan_type` | string | New/used vehicle, lease etc. |

*Schema subject to change — always verify against latest manifest.*

---

## Dataset: SLOOS Tables

**Source ID**: `fed_sloos`
**R2 Prefix**: `sloos/curated/source=fed_sloos_table_1/`

| Column | Type | Description |
|---|---|---|
| `survey_date` | date | Quarter-end survey date |
| `question_code` | string | Fed question identifier |
| `question_label` | string | Human-readable question text |
| `net_pct_tightening` | float | % banks tightening minus % easing (net) |
| `loan_type` | string | C&I, CRE, consumer, etc. |

---

## Dataset: FRED Macro Bundle

**Source ID**: `fred_macro`
**R2 Prefix**: `macro/curated/source=fred_api/`

| Column | Type | Description |
|---|---|---|
| `series_id` | string | FRED series identifier (e.g., `NFCI`) |
| `date` | date | Observation date |
| `value` | float | Series value |
| `units` | string | Units descriptor from FRED metadata |
| `series_name` | string | Human-readable series name |

---

## Contract Rules

1. Column names MUST NOT change without a version bump in this contract.
2. New columns MAY be added without a version bump (additive changes are safe).
3. The `r2-base-url` site parameter MUST be set before any chart renders.
4. Chart cells MUST NOT hardcode the bucket URL — always reference the site param.
5. If a Parquet glob (`*.parquet`) returns zero files, the chart MUST show an
   explicit error state, not a blank chart.
