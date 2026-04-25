# Implementation Plan: Ben's Field Notes — Site v1

**Branch**: `001-site-v1` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-site-v1/spec.md`

---

## Summary

Build a static Quarto website — a public data journal covering credit markets and
macroeconomics. Pages are `.qmd` notebooks combining prose, code, and live charts.
Charts query Cloudflare R2 Parquet files directly from the browser via DuckDB-WASM
inside Observable JS cells. No backend. No server. Deployed to Cloudflare Pages.

Primary deliverable for v1: home/landing, ABS-EE autoloan dashboard, SLOOS dashboard,
tagged notebook blog, and a data sources provenance page.

---

## Technical Context

**Language/Version**: Quarto 1.9 (`.qmd` files); Observable JS (native Quarto `{ojs}`
cells); SCSS for theming  
**Primary Dependencies**:
- Quarto (site renderer)
- DuckDB-WASM (browser-side SQL engine, loaded from CDN via `{ojs}`)
- Observable Plot (charting, loaded from CDN via `{ojs}`)
- Quarto listing engine (built-in, for blog index + tag filtering)

**Storage**: Cloudflare R2 (public read bucket). Parquet files only.
No local data files committed to this repo.  
**Testing**: Manual render verification + Lighthouse audit. No unit test framework.  
**Target Platform**: Static HTML/CSS/JS — all modern browsers supporting WebAssembly.  
**Project Type**: Static site / data journal  
**Performance Goals**: Live chart first render ≤ 5 seconds on broadband.
Parquet files should be kept under 50MB per query to stay within WASM memory limits.  
**Constraints**: Zero backend. Public R2 bucket required. No Node runtime at serve time.  
**Scale/Scope**: Single author, public readership. No concurrent user constraints.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|---|---|---|
| I. Data Provenance | ✅ PASS | Every chart cell in spec requires source + as-of + units + transforms. Enforced in FR-004. |
| II. Browser-Only Pipeline | ✅ PASS | DuckDB-WASM + R2 public bucket. No server. FR-001 and FR-002 explicitly prohibit backend. |
| III. Quarto Notebooks First | ✅ PASS | All pages are `.qmd`. Code and output colocated. FR-006 mandates this. |
| IV. Tone Standard | ✅ PASS | "Lowkey, analytical, rain-session" voice encoded in spec Assumptions. No banned phrases. |
| V. No Hidden Transforms | ✅ PASS | FR-004 + User Story 2 acceptance scenarios mandate inline transform docs. |
| VI. Visual Design | ✅ PASS | Muted/contemplative palette. Dark mode primary. SCSS custom properties required. |
| VII. Simplicity | ✅ PASS | Static host, single build command, no signed URL complexity in v1, FRED deferred to v2. |

**Gate result: PASS — proceed to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-site-v1/
├── plan.md                   # This file
├── research.md               # Phase 0 output
├── data-model.md             # Phase 1 output
├── quickstart.md             # Phase 1 output
├── contracts/                # Phase 1 output
│   ├── r2-data-contract.md
│   └── post-frontmatter-contract.md
└── tasks.md                  # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
bens-field-notes/
│
├── _quarto.yml               # Site config: nav, theme, formats, metadata
├── index.qmd                 # Landing / home page
│
├── posts/                    # Notebook blog — each post is a subdirectory
│   └── YYYY-MM-DD-slug/
│       └── index.qmd         # Post file (prose + ojs chart cells)
│
├── dashboards/
│   ├── abs-ee.qmd            # ABS-EE autoloan dashboard page
│   └── sloos.qmd             # SLOOS bank lending standards dashboard page
│
├── data-sources.qmd          # Provenance / methodology reference page
│
├── styles/
│   ├── _variables.scss       # CSS custom properties: palette, type scale, spacing
│   └── _theme.scss           # Quarto SCSS theme: overrides, dark mode, component styles
│
├── _extensions/              # Quarto extensions (added as needed)
│
├── .specify/                 # Spec-kit infrastructure (gitignored from .cursor/ only)
├── specs/                    # Spec artifacts (this directory)
├── docs/                     # DATA_CONTRACT.md, SPEC_KIT.md
└── .github/
    └── workflows/
        └── publish.yml       # Cloudflare Pages deploy on push to main
```

**Structure Decision**: Quarto website project with a `posts/` listing directory for
the blog and a `dashboards/` section for data-focused pages. SCSS theme files in
`styles/` keep all design tokens in one place. No `src/` or `app/` directories —
Quarto projects use the root as the project directory.

---

## Phase 0: Research

*All NEEDS CLARIFICATION items resolved below. No open questions remain.*

### research.md contents (inline)

**Decision 1: R2 public bucket access**
- Decision: Make the R2 bucket public. No signed URLs, no Cloudflare Worker in v1.
- Rationale: All source data (ABS-EE, SLOOS, FRED) is US government public data.
  There is no privacy, IP, or cost reason to restrict access. Public bucket access
  is supported natively by Cloudflare R2 and requires only enabling "Public Access"
  in the R2 dashboard and optionally configuring a custom domain.
- URL pattern: `https://<bucket-name>.r2.dev/<prefix>/<file>.parquet` or
  via a custom domain `https://data.bens-field-notes.com/<prefix>/<file>.parquet`
- Alternatives rejected: Signed URLs (requires a Worker or pre-generation step,
  adds complexity, expiry management); Cloudflare Worker proxy (overkill for
  public data, adds latency).

**Decision 2: Hosting — Cloudflare Pages vs GitHub Pages**
- Decision: Cloudflare Pages.
- Rationale: Same Cloudflare ecosystem as R2 (potential CORS simplification, shared
  dashboard, future R2 access control without extra work). Free tier is generous.
  Deploys directly from GitHub on push. `quarto render` output goes to `_site/`,
  which Cloudflare Pages serves directly.
- Alternatives rejected: GitHub Pages (fine technically, but adds a CORS configuration
  step between GitHub Pages and R2; Cloudflare Pages avoids this entirely).

**Decision 3: DuckDB-WASM loading pattern**
- Decision: Load DuckDB-WASM from the jsDelivr CDN inside a shared `{ojs}` cell
  that is imported or repeated on chart pages. Use `DuckDBClient` from
  `@duckdb/duckdb-wasm`.
- Pattern:
  ```js
  // In any {ojs} cell — runs once per page
  import { DuckDBClient } from "npm:@duckdb/duckdb-wasm"
  db = DuckDBClient.of({})
  ```
  Then query:
  ```js
  data = db.query(`
    SELECT * FROM read_parquet('${R2_BASE_URL}/abs_ee/curated/asset_class=autoloan/*.parquet')
  `)
  ```
- Rationale: Native Observable JS support for DuckDB-WASM. CDN load from jsDelivr
  is reliable and has no build step. The `DuckDBClient` wrapper handles WASM
  initialization transparently.

**Decision 4: Chart library — Observable Plot**
- Decision: Observable Plot as primary. D3 permitted for one-off custom layouts.
- Rationale: Observable Plot produces clean, minimal, data-forward charts with
  very little boilerplate. Native Observable JS integration — no npm install, no
  build step. Output is SVG-based and respects CSS custom properties (dark mode
  compatible). Strong fit for time-series line charts (primary chart type here).

**Decision 5: Quarto blog listing + tags**
- Decision: Use Quarto's built-in `listing` feature with `categories: true`.
  Each post sets `categories` in YAML frontmatter (these are the topic tags).
  Quarto auto-generates the listing index and per-category pages.
- Rationale: Zero custom code. Quarto's listing engine handles pagination,
  filtering, and tag index pages out of the box. The `categories` field in
  frontmatter is the tag system.

**Decision 6: SCSS theming**
- Decision: Quarto supports custom SCSS themes via the `theme` key in `_quarto.yml`.
  Two files: `_variables.scss` (CSS custom properties, Quarto variable overrides)
  and `_theme.scss` (structural overrides, dark mode media queries, component styles).
- Palette (v1 starting point, adjustable without changing constitution):
  - Light: background `#F5F0E8`, text `#2C2C2C`, accent `#4A6FA5` (slate blue)
  - Dark: background `#1C1C1E`, text `#E8E3D8`, accent `#7BA3C8` (lighter slate)
  - Muted secondary: `#8A8A8A` (timestamps, captions, labels)
  - Chart palette: slate blue, warm amber, muted sage — max 4 series colors

---

## Phase 1: Data Model

*See [data-model.md](./data-model.md) (written below as inline section).*

### Entity: Post

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Display title |
| `date` | ISO date | yes | Publication date |
| `description` | string | yes | 1–2 sentence excerpt for listing |
| `categories` | string[] | no | Topic tags (#consumer-credit, #credit-risk, etc.) |
| `type` | enum | no | `deep-dive`, `signal-watch`, `explainer`, `credit-risk`, `notebook` |
| `draft` | boolean | no | Default false. Draft posts excluded from listing. |
| `image` | path | no | Optional thumbnail for listing page |
| `r2_base_url` | string | no | Override per-post if needed; defaults to site param |

### Entity: Dataset Page (Dashboard)

| Field | Type | Notes |
|---|---|---|
| `title` | string | Page title |
| `dataset_id` | string | One of: `abs_ee_autoloan`, `fed_sloos`, `fred_macro` |
| `r2_prefix` | string | Hive partition path under R2 bucket root |
| `last_updated` | date | Updated by pipeline; shown on page |
| `chart_cells` | ojs[] | One or more `{ojs}` cells producing Observable Plot charts |

### Entity: Data Source Entry (provenance page)

| Field | Type | Notes |
|---|---|---|
| `id` | string | Matches `dataset_id` above |
| `name` | string | Human name: "SEC EDGAR ABS-EE Autoloan Panel" |
| `publisher` | string | "SEC / Office of Structured Finance" |
| `update_cadence` | string | "Monthly (new filings)" |
| `r2_prefix` | string | `abs_ee/curated/asset_class=autoloan/` |
| `key_variables` | string[] | Variable names + 1-sentence definitions |
| `known_limitations` | string[] | Data caveats, coverage gaps, definitional ambiguities |
| `source_url` | url | Canonical source link |

### Entity: Chart Cell (inside any `.qmd`)

| Field | Type | Notes |
|---|---|---|
| source attribution | string | Visible on render: "Source: [publisher]" |
| as_of | date | Visible on render: "As of [date]" |
| units | string | Visible on render or axis label |
| transforms | string | Inline prose: smoothing, aggregation, rebase notes |
| query | duckdb sql | `{ojs}` cell content |
| plot | Observable Plot | `{ojs}` cell content, references query output |

---

## Complexity Tracking

No constitution violations. No complexity justification required.

---
