<!--
SYNC IMPACT REPORT
==================
Version change: (none) → 1.0.0 (initial ratification)
Added sections: all (initial constitution)
Modified principles: n/a (new)
Removed sections: n/a
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (no structural changes required; principles inform plan constraints)
  - .specify/templates/spec-template.md ✅ (provenance + tone requirements carry into FR sections)
  - .specify/templates/tasks-template.md ✅ (no structural changes required)
Follow-up TODOs:
  - TODO(RATIFICATION_DATE): confirm exact adoption date if needed for audit trail
-->

# Ben's Field Notes — Constitution

## Core Principles

### I. Data Provenance Is Non-Negotiable

Every chart, table, and derived figure MUST display:
- Source name (e.g., "Federal Reserve H.8", "SEC EDGAR ABS-EE", "FRED / NFCI")
- As-of date or vintage (the date the underlying data was last updated)
- Units explicitly stated (percent, index, USD, count — no ambiguity)
- Any smoothing, window, or transformation applied (e.g., "4-week moving average",
  "seasonally adjusted", "log scale")

Rationale: The site makes claims about real financial data. A reader MUST be able
to reproduce or challenge every number. Omitting provenance is the equivalent of
citing "trust me, bro" as a source. We are better than that.

### II. Browser-Only Data Pipeline (No Backend Server)

All live data retrieval MUST run client-side in the browser. No backend API,
no server-side rendering of data, no Node.js data proxy.

Permitted data path: R2 Parquet → DuckDB-WASM → Observable JS (`{ojs}` cells)
→ Observable Plot or custom chart rendering.

R2 bucket public URL pattern: `https://<bucket>.r2.dev/<prefix>/*.parquet`

Rationale: Zero egress cost on Cloudflare R2 for public bucket reads. No server
to maintain, no runtime costs, no infrastructure to debug at 2am. Static hosting
only. If a chart cannot be built within this constraint, the constraint wins and
we find a different chart type.

### III. Quarto Notebooks Are First-Class Citizens

Pages MUST be written as `.qmd` files. Narrative prose, methodology notes, and
chart code coexist in the same document. Analysis is never separated from its
visual output.

- Code cells (`{ojs}`) MUST appear immediately adjacent to the output they produce.
- Methodology notes (data caveats, definition choices) MUST appear on the same
  page as the chart they describe — not in a separate "about" page.
- Static pages (no live data) are permitted but MUST be marked as such.

Rationale: The site is a data journal, not a dashboard app. Notebooks are the
medium. Separating the code from the story defeats the purpose entirely.

### IV. Tone Standard — Dry, Sarcastic, Rigorous (In That Order)

Written copy MUST follow the "Rigorous Analysis. Questionable Conclusions." voice:
- Dry humor and sarcasm are permitted in narrative text, headlines, and captions.
- Sarcasm MUST NEVER substitute for methodology. If the number is surprising, show
  the work first, then make the joke.
- Self-deprecation is encouraged. Hype language is banned.
- Hedging language is permitted only when genuine uncertainty exists (e.g.,
  "preliminary data", "subject to revision"). It MUST NOT appear in every sentence
  as a defensive shield.
- Charts and labels MUST remain clinically factual — no humor in axis labels or
  legends that could obscure meaning.

Banned phrases: "unlock the potential of", "deep dive", "robust", "leverage",
"actionable insights", "game-changing", and any sentence that opens with
"In today's fast-paced world".

### V. No Hidden Transforms

Any data transformation applied between the raw Parquet file and the rendered
chart MUST be documented inline on the same page. This includes:
- Aggregation level (monthly, quarterly, annual)
- Join keys used when combining datasets
- Fill/interpolation logic for missing values
- Index rebasing (e.g., "rebased to 100 at 2007-Q3")
- Seasonal adjustment status (SA vs NSA)

If a transformation is complex enough to require more than two sentences to
explain, it deserves a callout box, not a footnote.

### VI. Visual Design — Muted, Editorial, Data-Forward

The visual system MUST follow these constraints:
- Background: off-white / light cream (day mode), deep charcoal (dark mode)
- Text: charcoal / near-black (day), off-white (dark)
- Accent palette: muted, no neon. Warm earth tones or cool slate. Single
  primary accent color; one secondary at most.
- Typography: one display/heading font (distinctive, not Inter), one body font
  (readable at 16–18px).
- Chart ink: restrained. Data-ink ratio MUST be high. No 3D charts. No pie charts
  unless there are exactly two slices and we're making a point about how bad
  pie charts are.
- Every page MUST work in both light and dark mode. No hardcoded hex colors in
  `{ojs}` cells — use CSS custom properties.

### VII. Simplicity and Restraint

Build the simplest thing that works. Complexity requires justification.
- A static page beats a live page when the data doesn't change often.
- A plain line chart beats an animated one unless animation reveals something
  a static view cannot.
- A table beats a chart when the exact number matters more than the trend.
- Do not add a dependency (npm, Python lib, CDN import) without knowing exactly
  why it is needed and what it costs in bundle size or maintenance.

## Technology Stack

- **Site framework**: Quarto (`.qmd` notebooks → static HTML)
- **Interactivity**: Observable JS (`{ojs}` cells)
- **Browser analytics**: DuckDB-WASM (via `@duckdb/duckdb-wasm` from CDN)
- **Charts**: Observable Plot (primary); raw D3 permitted for custom layouts
- **Data at rest**: Parquet on Cloudflare R2 (Hive-partitioned)
- **Hosting**: GitHub Pages or Cloudflare Pages (static, no Node runtime)
- **Version control**: Git / GitHub (public repo: `benuehlinger/bens-field-notes`)
- **Theming**: Quarto SCSS custom theme (`_variables.scss`, `_theme.scss`)
- **Spec management**: GitHub Spec Kit (`specify-cli` v0.8.x)

Prohibited: React, Next.js, backend API routes, server-side data fetching,
client-side authentication, cookies for data access.

## Data Sources

| Source ID | Description | R2 Prefix | Update Cadence |
|---|---|---|---|
| `abs_ee_autoloan` | ABS-EE autoloan panel (SEC EDGAR) | `abs_ee/curated/asset_class=autoloan/` | Monthly |
| `fed_sloos` | SLOOS Table 1 + Table 2 (Federal Reserve) | `sloos/curated/source=fed_sloos_table_1/` | Weekly (post-release) |
| `fred_macro` | FRED macro bundle (NFCI, spreads, delinquencies) | `macro/curated/source=fred_api/` | Daily |

R2 bucket environment variable: `R2_BUCKET` (set in `.env.local`, never committed).
Public read URL pattern documented in `docs/DATA_CONTRACT.md`.

## Governance

This constitution supersedes all other guidance documents for this project.
When a README, inline comment, or chat instruction conflicts with this constitution,
the constitution wins. Update the other document, not the constitution.

**Amendment procedure**:
1. Edit `.specify/memory/constitution.md` directly via `/speckit-constitution`.
2. Increment version per semantic versioning (MAJOR.MINOR.PATCH):
   - MAJOR: principle removed, redefined, or renamed in a breaking way
   - MINOR: new principle or section added
   - PATCH: clarification, wording, typo fix
3. Run consistency propagation (update templates and docs that reference the
   changed principle).
4. Commit with message: `docs: amend constitution to vX.Y.Z (<reason>)`

**Compliance**:
- Every new page (`.qmd`) MUST satisfy Principles I, II (if live), III, IV, and V
  before it is merged to `main`.
- Visual system changes MUST satisfy Principle VI.
- All AI agent work in this repo operates under this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-04-25 | **Last Amended**: 2026-04-25
