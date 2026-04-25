# Tasks: Ben's Field Notes — Site v1

**Branch**: `001-site-v1` | **Date**: 2026-04-25
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Total tasks**: 42 | **Parallelizable**: 18

---

## Dependency Graph

```
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 3 (US1 Landing)
                                        → Phase 4 (US2 ABS-EE)  [can run with Phase 3]
                                        → Phase 5 (US3 SLOOS)   [can run with Phase 3]
                                        → Phase 6 (US4 Blog)    [can run with Phase 3]
                                        → Phase 7 (US5 Data Sources) [can run with Phase 3]
Phase 3–7 complete → Phase 8 (Polish + Deploy)
```

After Phase 2 is done, all user story phases can run in parallel.
In practice: do Phase 3 (landing) first since it validates the scaffold,
then Phase 4 (ABS-EE chart) since it's the core proof of concept.

---

## Phase 1 — Project Setup

*Initialize the Quarto project and connect to GitHub. No Quarto installed yet? Run `brew install --cask quarto` first.*

- [ ] T001 Install Quarto via `brew install --cask quarto` and verify with `quarto check`
- [ ] T002 Run `quarto create project website .` in `/Users/benuehlinger/bens-field-notes` to scaffold the Quarto website project (accept overwrite prompts — only adds `_quarto.yml` and example files)
- [ ] T003 Create GitHub remote repo `benuehlinger/bens-field-notes` (public) and push current `main` branch: `git remote add origin https://github.com/benuehlinger/bens-field-notes.git && git push -u origin main`
- [ ] T004 Push `001-site-v1` feature branch to GitHub: `git push -u origin 001-site-v1`
- [ ] T005 Add `_site/` and `.quarto/` to `.gitignore` if not already present — these are Quarto build outputs, never committed
- [ ] T006 [P] Configure Cloudflare R2 bucket for public read access: in the Cloudflare dashboard, navigate to R2 → your bucket → Settings → enable "Public Access" and note the public bucket URL (format: `https://<bucket-name>.r2.dev`)
- [ ] T007 Update `.env.example` to document `R2_BASE_URL=https://your-bucket.r2.dev` and create `.env.local` with the real R2 public URL (never committed)

---

## Phase 2 — Foundation (Blocks All User Story Phases)

*Quarto config, theme tokens, and shared OJS utilities. Everything else builds on top of these.*

- [ ] T008 Write `_quarto.yml` — site config: title "Ben's Field Notes", navbar with Home / Dashboards / Notes / Data Sources links, theme pointing to `styles/theme.scss`, output-dir `_site`, `r2-base-url` site param from env, freeze disabled for live OJS, format: html with self-contained false
- [ ] T009 Create `styles/_variables.scss` — CSS custom properties and Quarto SCSS variable overrides: light palette (`#F5F0E8` bg, `#2C2C2C` text, `#4A6FA5` accent), dark palette (`#1C1C1E` bg, `#E8E3D8` text, `#7BA3C8` accent), muted grey `#8A8A8A`, type scale, spacing scale, font imports (display + body — NOT Inter)
- [ ] T010 Create `styles/theme.scss` — structural Quarto theme overrides: body typography, heading styles, navbar styling, dark mode `@media (prefers-color-scheme: dark)` block, code block styles, chart caption styles (source/as-of annotation pattern), generous whitespace on `.content`
- [ ] T011 Create `styles/ojs-utils.js` (or inline shared `{ojs}` cell) — reusable OJS helpers: `loadDuckDB()` returning a configured `DuckDBClient`, `r2Url(prefix)` returning the full R2 path, `chartError(message)` returning a styled error div for data load failures, `asOf(date)` returning a formatted annotation string
- [ ] T012 Verify the scaffold renders: run `quarto preview` and confirm the site opens at `localhost:4321` with correct title, nav, and theme colors applied

---

## Phase 3 — US1: Landing Page (Home)

*Goal: A first-time visitor understands the site's purpose and voice within 30 seconds.*
*Independent test: Open the home page cold — is it clear what this is?*

- [ ] T013 [US1] Write `index.qmd` — landing page: site title "Ben's Field Notes", tagline "Rigorous Analysis. Questionable Conclusions.", 2–3 sentence description in the dry/lowkey voice, recent posts listing (`{listing}` block pointing at `posts/`), navigation links to Dashboards and Notes sections
- [ ] T014 [P] [US1] Add hero/intro section to `index.qmd` — short bio in the "curious person with too many datasets" voice (no hype, no CV summary, no bullet points of skills), making clear this is a public data journal about credit markets
- [ ] T015 [P] [US1] Configure Quarto listing in `index.qmd` to show the 5 most recent posts with title, date, description, and categories (tags) — use `type: default` listing, `max-items: 5`, `sort: date desc`
- [ ] T016 [US1] Create `posts/` directory with a placeholder post `posts/2026-04-25-hello/index.qmd` — minimal post with correct frontmatter (title, date, description, categories: [methodology]) demonstrating the format, used to test listing renders correctly

---

## Phase 4 — US2: ABS-EE Autoloan Dashboard (Core Proof of Concept)

*Goal: A reader sees a live delinquency trend chart with full provenance.*
*Independent test: Chart loads from R2, shows source/as-of/units, no blank failures.*

- [ ] T017 [US2] Create `dashboards/abs-ee.qmd` — page scaffold: title "Auto Loan Credit — ABS-EE Panel", frontmatter with `freeze: false` (live OJS), intro paragraph explaining the dataset in plain English with appropriate dry aside about the joy of parsing SEC filings
- [ ] T018 [US2] Write the DuckDB-WASM initialization `{ojs}` cell in `dashboards/abs-ee.qmd` — imports `DuckDBClient` from CDN, initializes `db`, sets `r2 = params["r2-base-url"]`, includes error handling if `r2` is undefined
- [ ] T019 [US2] Write the delinquency trend query `{ojs}` cell — SQL aggregating ABS-EE Parquet: group by `filing_date`, calculate `90+` delinquency rate as `COUNT(*) FILTER (WHERE days_past_due >= 90) / COUNT(*) * 100`, order by date. Handle empty result with explicit error message.
- [ ] T020 [US2] Write the delinquency chart `{ojs}` cell using Observable Plot — `Plot.lineY()`, x axis = `filing_date`, y axis = delinquency rate in %, muted slate blue line color, minimal grid, no legend (single series), caption block: "Source: SEC EDGAR ABS-EE | Units: % of loans 90+ DPD | No smoothing applied | As of [as_of_date]"
- [ ] T021 [P] [US2] Add a second query + chart for total loan count over time (proof of data volume / "we parsed all of this") — same DuckDB session, `COUNT(*)` by filing date, simple area or bar chart
- [ ] T022 [P] [US2] Write inline methodology paragraph below the chart — define "90+ day delinquency" used in the chart, note which loan types are included, note any known filing gaps or coverage caveats sourced from `DATA_CONTRACT.md`
- [ ] T023 [US2] Add explicit data load error state — if the DuckDB query fails or returns zero rows, the `{ojs}` cell renders a styled error div: "Data unavailable — check R2 connection or try refreshing" rather than blank space

---

## Phase 5 — US3: SLOOS Dashboard

*Goal: Second dataset page, validates the chart pattern established in Phase 4.*
*Independent test: SLOOS net tightening chart loads, provenance visible.*

- [ ] T024 [US3] Create `dashboards/sloos.qmd` — page scaffold: title "Bank Lending Standards — SLOOS", intro explaining SLOOS (Senior Loan Officer Opinion Survey) in 2–3 sentences, dry observation about the Fed's fondness for asking bankers how they feel
- [ ] T025 [US3] Write DuckDB query `{ojs}` cell for SLOOS net tightening — query `sloos/curated/source=fed_sloos_table_1/` Parquet, select `survey_date`, `net_pct_tightening`, `loan_type`, filter to C&I and Consumer categories. Reuse `loadDuckDB()` helper from Phase 2.
- [ ] T026 [US3] Write SLOOS chart `{ojs}` cell — `Plot.lineY()` with `stroke: "loan_type"` for multi-series, color palette using muted chart colors from theme, horizontal zero reference line (`Plot.ruleY([0])`), caption with source/as-of/units
- [ ] T027 [P] [US3] Add annotation paragraph: what net tightening means (positive = more banks tightening than easing), what a value above +20 has historically signaled, current reading vs GFC peak — written in the dry analytical voice

---

## Phase 6 — US4: Blog / Notes with Tag Navigation

*Goal: Reader can browse posts by topic tag. Tag click → filtered listing.*
*Independent test: Click a tag → filtered listing shows only matching posts.*

- [ ] T028 [US4] Configure Quarto listing page at `posts/index.qmd` — full post listing with categories filter enabled (`filter: true`), date sort descending, show title/date/description/categories per item, page title "Notes"
- [ ] T029 [US4] Add navbar link to "Notes" pointing to `posts/index.qmd`
- [ ] T030 [P] [US4] Write a second demo post `posts/2026-04-25-abs-ee-intro/index.qmd` — short explainer post: what ABS-EE is, why it's interesting for credit risk analysis, categories: [structured-finance, consumer-credit, methodology]. This becomes the first real content post.
- [ ] T031 [P] [US4] Verify tag filtering works end-to-end: `quarto preview`, click a category tag on the listing page, confirm filtered view shows only matching posts
- [ ] T032 [US4] Update `_quarto.yml` listing configuration to show categories as clickable badges on each listing item (Quarto listing `fields: [date, title, description, categories]`)

---

## Phase 7 — US5: Data Sources Provenance Page

*Goal: A skeptical reader can verify every dataset used on the site.*
*Independent test: Every dataset entry answers what/who/cadence/caveats.*

- [ ] T033 [US5] Create `data-sources.qmd` — page title "Data Sources", intro sentence about methodology transparency, three dataset sections: ABS-EE Autoloan Panel, SLOOS Tables, FRED Macro Bundle
- [ ] T034 [US5] Write ABS-EE entry — name, publisher (SEC/EDGAR), update cadence (monthly), R2 prefix, key variables (filing_date, days_past_due, delinquency_status, loan_type), known limitations (self-reported servicer data, definition varies by issuer)
- [ ] T035 [US5] Write SLOOS entry — name, publisher (Federal Reserve), update cadence (quarterly, typically 2 weeks post-survey), R2 prefix, key variable (net_pct_tightening), known limitation (survey-based, captures intent not actual volume)
- [ ] T036 [P] [US5] Write FRED macro bundle entry — note it is present in the data lake but not yet surfaced on the site (deferred to v2), include the R2 prefix for reference so readers can verify the data exists
- [ ] T037 [US5] Add "Data Sources" link to navbar in `_quarto.yml`

---

## Phase 8 — Polish, Accessibility, Deploy

*Runs after Phases 3–7 are complete. Cross-cutting quality and launch tasks.*

- [ ] T038 Dark mode verification — run `quarto preview`, manually toggle OS dark mode, verify: background/text flip correctly, chart colors are readable (not hardcoded), no elements break layout in dark mode
- [ ] T039 Mobile responsiveness check — open preview on 375px viewport (Chrome DevTools), verify: nav collapses correctly, charts resize without overflow, text is readable at default mobile font size
- [ ] T040 [P] Lighthouse audit — run Lighthouse in Chrome DevTools on home page and one chart page, fix any accessibility failures (missing alt text, color contrast below 4.5:1, missing landmark roles) until both pages score 90+
- [ ] T041 Cloudflare Pages deploy setup — in Cloudflare dashboard: connect GitHub repo `benuehlinger/bens-field-notes`, set build command `quarto render`, output directory `_site`, add `R2_BASE_URL` as environment variable. Trigger first deploy.
- [ ] T042 Create `.github/workflows/publish.yml` — GitHub Actions workflow: trigger on push to `main`, install Quarto, run `quarto render`, deploy to Cloudflare Pages via `cloudflare/pages-action`. Documents the deploy pipeline in code.

---

## Implementation Strategy

**MVP scope** (minimum viable site worth sharing):
T001 → T012 (setup + foundation) + T013–T016 (landing) + T017–T023 (ABS-EE chart).
That's ~23 tasks. A working site with a live chart, correct theme, and a home page.

**Full v1**: all 42 tasks. Adds SLOOS dashboard, blog with tags, data sources page, and deploy pipeline.

**Suggested execution order** given "all at once" preference:
Run Phase 1 + 2 first (blocking). Then Phases 3 + 4 in parallel (landing + ABS-EE chart validate the whole stack). Then Phases 5 + 6 + 7 together. Then Phase 8 last.
