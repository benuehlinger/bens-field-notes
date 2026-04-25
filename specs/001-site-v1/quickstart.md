# Quickstart: Ben's Field Notes

## Prerequisites

| Tool | Install | Version |
|---|---|---|
| Quarto | `brew install --cask quarto` | 1.9+ |
| uv | `curl -LsSf https://astral.sh/uv/install.sh \| sh` | 0.11+ |
| Git | pre-installed on macOS | any |

## Setup

```bash
# Clone the repo
git clone https://github.com/benuehlinger/bens-field-notes.git
cd bens-field-notes

# Copy env file (set your R2 public base URL)
cp .env.example .env.local
# Edit .env.local: set R2_BASE_URL=https://your-bucket.r2.dev
```

## Local Development

```bash
# Preview the site with live reload
quarto preview

# Open http://localhost:4321 in your browser
```

## Build

```bash
# Render to _site/ directory
quarto render
```

## Writing a New Post

```bash
# Create the post directory and file
mkdir -p posts/YYYY-MM-DD-your-slug
touch posts/YYYY-MM-DD-your-slug/index.qmd
```

Add frontmatter (see `specs/001-site-v1/contracts/post-frontmatter-contract.md`),
write your analysis, add `{ojs}` chart cells as needed.

## Adding a Chart Cell

In any `.qmd` file:

````qmd
```{ojs}
//| echo: false

// Load DuckDB-WASM
import { DuckDBClient } from "npm:@duckdb/duckdb-wasm"
db = DuckDBClient.of({})

// Query R2 directly
r2 = params["r2-base-url"]
data = await db.query(`
  SELECT
    filing_date,
    COUNT(*) FILTER (WHERE days_past_due >= 90) * 1.0 / COUNT(*) AS delinq_rate
  FROM read_parquet('${r2}/abs_ee/curated/asset_class=autoloan/*.parquet')
  GROUP BY filing_date
  ORDER BY filing_date
`)

// Render with Observable Plot
Plot.lineY(data, { x: "filing_date", y: "delinq_rate" }).plot({
  color: { scheme: "blues" },
  y: { tickFormat: "%", label: "90+ Day Delinquency Rate" },
  caption: "Source: SEC EDGAR ABS-EE | Units: % of loans | No smoothing applied"
})
```
````

## Deploying

Push to `main` — Cloudflare Pages deploys automatically via GitHub Actions.
The `_site/` directory is the build output; it is gitignored.

## Spec-Kit Workflow

```bash
# Next phase: generate tasks
/speckit-tasks

# Then implement
/speckit-implement
```
