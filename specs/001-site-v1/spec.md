# Feature Specification: Ben's Field Notes — Site v1

**Feature Branch**: `001-site-v1`
**Created**: 2026-04-25
**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 — A curious reader finds the site and understands what it is (Priority: P1)

A person stumbles on the site via a link, search, or social share. Within 30 seconds
they understand: who runs it, what kind of data it covers, and whether they should
keep reading.

**Why this priority**: Without a clear landing experience, every other page is
irrelevant. The home page is the first thing that either earns or wastes the
reader's attention.

**Independent Test**: Can be fully tested by opening the home page cold and asking
"do I know what this site is and what I'll find here?" — delivers standalone value
as the site's front door.

**Acceptance Scenarios**:

1. **Given** a first-time visitor lands on the home page, **When** they read the
   headline and tagline, **Then** they understand this is a data journal about
   credit markets and financial data, written with an irreverent voice.
2. **Given** a visitor sees the recent posts / notes list, **When** they scan it,
   **Then** they can identify post topics by tag without clicking anything.
3. **Given** a visitor is on mobile, **When** they load the page, **Then** all
   content is readable and no elements overflow the viewport.

---

### User Story 2 — A reader follows a credit signal in the data (Priority: P1)

A reader wants to understand what's happening in auto loan credit right now.
They navigate to the ABS-EE autoloan page, see a chart of delinquency trends,
read the accompanying analysis, and leave with an informed view — or at least
a well-informed skepticism.

**Why this priority**: This is the core value proposition of the site. One dataset,
one well-explained chart, one honest analysis. Everything else builds on this.

**Independent Test**: Can be fully tested by navigating to the ABS-EE autoloan
page and verifying: the chart loads with live data, source and as-of date are
visible, and the accompanying text explains what the chart shows.

**Acceptance Scenarios**:

1. **Given** a reader opens the ABS-EE autoloan page, **When** the page loads,
   **Then** a delinquency trend chart renders with data loaded live from R2
   Parquet, showing at minimum the last 12 months of available data.
2. **Given** the chart is rendered, **When** the reader inspects it, **Then**
   they can see: dataset source ("SEC EDGAR ABS-EE"), as-of date, units
   (percentage or count — whichever applies), and any smoothing applied.
3. **Given** a reader wants methodology context, **When** they read the page,
   **Then** the data definition (what counts as "delinquent", which loan
   types are included) is explained inline — not linked away.

---

### User Story 3 — A professional shares a specific analysis at work (Priority: P2)

A credit risk analyst finds a piece of analysis on the site worth sharing with
a colleague. They copy the URL, paste it into Slack or email, and the recipient
can read the full analysis and charts with no login, no paywall, and no broken
layout.

**Why this priority**: Professional credibility requires the site to work
reliably as a shareable artifact. If charts break when shared or the layout
looks broken on someone else's machine, the credibility signal is negative.

**Independent Test**: Share a URL to any content page with a colleague on a
different machine; verify the page renders correctly including all charts.

**Acceptance Scenarios**:

1. **Given** a content page URL is opened on a machine that has never visited
   the site, **When** the page loads, **Then** all charts render correctly
   within 5 seconds on a standard broadband connection.
2. **Given** a reader clicks through from a shared link, **When** they arrive,
   **Then** no login, registration, or API key is required to view any content.
3. **Given** the page is viewed in a browser with no JavaScript extensions,
   **When** the page loads, **Then** at minimum the prose and chart source
   information are readable (graceful degradation for charts is acceptable).

---

### User Story 4 — A reader discovers related posts via tags (Priority: P2)

A reader finishes an analysis on auto loan delinquencies and wants to find
other credit-related posts on the site. They click a topic tag and see a
filtered list of related notes.

**Why this priority**: Tags are the main navigation mechanism for a content-first
site. Without them, the site becomes a dead end after one post.

**Independent Test**: Click a tag on any post and verify the tag listing page
shows only posts sharing that tag.

**Acceptance Scenarios**:

1. **Given** a post has a topic tag (e.g., #consumer-credit), **When** a reader
   clicks the tag, **Then** they see a listing of all posts with that same tag.
2. **Given** a reader is on the tag listing page, **When** they look at any
   listed post, **Then** they can see the post title, date, a brief excerpt or
   description, and its tags.

---

### User Story 5 — A reader understands where the data comes from (Priority: P3)

A skeptical but curious reader wants to verify the data sources before trusting
any chart. They navigate to the Data Sources page and find a plain-language
description of each dataset: what it is, who produces it, how it's processed,
and any known limitations.

**Why this priority**: Provenance is a constitutional requirement. The data
sources page is its dedicated home.

**Independent Test**: Navigate to the Data Sources page and verify each dataset
(ABS-EE, SLOOS, FRED macro) has a description, source link, update cadence,
and any known caveats.

**Acceptance Scenarios**:

1. **Given** a reader opens the Data Sources page, **When** they read it, **Then**
   each dataset entry answers: what is it, who publishes it, how often it updates,
   what the key variables mean, and what limitations they should know.
2. **Given** a dataset is updated in the data lake, **When** a reader checks the
   as-of date on a chart, **Then** it matches the actual data vintage within
   one business day of the lake update.

---

### Edge Cases

- What happens if a Parquet file on R2 is missing or returns a 403/404?
  Chart must show a clear error state ("data unavailable") rather than a blank
  chart or a silent failure.
- What if a reader's browser doesn't support WebAssembly (required for DuckDB-WASM)?
  Display a fallback message explaining that an updated browser is required.
- What if R2 data takes more than 10 seconds to load?
  Chart shows a loading state; if query exceeds 30 seconds, shows a timeout error.
- What if a post has no tags?
  The post must still render; tags are encouraged but not mandatory in the CMS.
- What if the site is viewed with JavaScript disabled?
  Prose, headings, source citations, and static images must remain readable.
  Live charts degrade gracefully to a "requires JavaScript" notice.

---

## Requirements

### Functional Requirements

- **FR-001**: The site MUST be composed entirely of static files (HTML, CSS, JS)
  and MUST NOT require a backend server or runtime to serve pages to readers.
- **FR-002**: All live data retrieval MUST occur client-side in the reader's browser,
  using DuckDB-WASM querying Parquet files on Cloudflare R2.
- **FR-003**: The R2 bucket MUST be configured for public read access before any
  live chart can function. No signed URL infrastructure is required for v1.
  *(See Assumptions — R2 public access decision.)*
- **FR-004**: Every chart page MUST display: dataset source name, as-of date or
  data vintage, units, and any applied transformations.
- **FR-005**: The site MUST render a home/landing page that explains the site's
  purpose, displays recent posts, and is navigable to all main sections.
- **FR-006**: The site MUST publish notebook-style posts as `.qmd` files; each
  post MAY contain prose, code cells, and live chart cells on the same page.
- **FR-007**: Posts MUST support topic-based tags (e.g., #consumer-credit,
  #credit-risk, #macro, #banking). Clicking a tag MUST display a filtered
  listing of all posts sharing that tag.
- **FR-008**: The site MUST include a dedicated ABS-EE autoloan analysis page
  with at minimum one delinquency trend chart loaded live from R2 Parquet.
- **FR-009**: The site MUST include a dedicated SLOOS page (bank lending
  standards) as a second dataset-focused page.
- **FR-010**: The site MUST include a Data Sources page describing each dataset
  (ABS-EE, SLOOS, FRED macro) with plain-language provenance documentation.
- **FR-011**: The site MUST support dark mode and light mode. The reader's
  OS/browser preference MUST be respected automatically. A manual toggle is
  desirable but not required for v1.
- **FR-012**: All pages MUST be readable on mobile viewports (minimum 375px width).
- **FR-013**: The site MUST be deployable to a static host (Cloudflare Pages
  recommended — see Assumptions) via a single build command (`quarto render`).
- **FR-014**: Chart error states MUST be handled explicitly: data loading failures
  show a user-facing error message, not a blank space.

### Key Entities

- **Post / Note**: A `.qmd` notebook file. Has a title, publish date, one or more
  topic tags, optional prose + code cells, optional live chart cells. May have
  a "type" descriptor (signal watch, deep dive, explainer, etc.).
- **Topic Tag**: A short label categorizing post content by subject area
  (e.g., consumer-credit, macro, banking, credit-risk). A post can have multiple
  tags. Tags are not dataset names — they describe the analytical topic.
- **Dataset Page**: A dedicated page for one data source. Has a chart section
  (live from R2), a methodology section, and a link to the Data Sources page
  for full provenance. v1 has two: ABS-EE autoloan, SLOOS.
- **Data Source Entry**: A structured description of one R2 dataset. Contains:
  name, publisher, update cadence, key variable definitions, known limitations,
  R2 bucket prefix.
- **Chart Cell**: An `{ojs}` cell within a `.qmd` page. Queries R2 Parquet via
  DuckDB-WASM, renders via Observable Plot. Self-contained: carries its own
  source citation and as-of annotation.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A first-time visitor can identify the site's topic and voice within
  30 seconds of landing on the home page, without scrolling below the fold.
- **SC-002**: A live chart (R2 Parquet via DuckDB-WASM) renders within 5 seconds
  on a standard broadband connection from first page load.
- **SC-003**: Every chart on the site passes a provenance check: source, as-of
  date, units, and transforms are all visible without clicking anything.
- **SC-004**: A reader can navigate from any post to a tag listing and find at
  least one other related post in under 2 clicks.
- **SC-005**: The site builds successfully with a single `quarto render` command
  from a clean checkout with no manually set environment variables beyond R2
  public URL configuration.
- **SC-006**: All pages score 90+ on Lighthouse accessibility on desktop and
  mobile (automated, not manual — this is a floor, not a ceiling).
- **SC-007**: Zero charts silently fail. A data load failure MUST produce a
  visible error state, not a blank chart area.

---

## Assumptions

- **R2 public access**: All data in the R2 bucket is derived from public sources
  (SEC EDGAR, Federal Reserve, FRED). The bucket MUST be made public before v1
  launches. No signed URL infrastructure or Cloudflare Worker is needed for v1.
  This eliminates a significant complexity layer. If access control becomes
  necessary later, it can be added without changing the site architecture.
- **Hosting**: Cloudflare Pages is the recommended host. It is free for static
  sites, deploys directly from GitHub, and shares the Cloudflare ecosystem with
  the R2 bucket (potential future benefits for access control, CDN caching).
  GitHub Pages is an acceptable alternative with no functional difference for v1.
- **No authentication**: The site is entirely public. No reader accounts,
  no login, no personalization. The data is public; the analysis is public.
- **Post cadence**: No fixed cadence. Posts are published when there is something
  worth saying — data drops, signals worth flagging, or a deep-dive that took
  time to build. The site architecture does not enforce or suggest a schedule.
  No "last posted X days ago" counters. No pressure framing.
- **FRED macro page**: Not in scope for v1. The FRED bundle (NFCI, spreads,
  delinquencies) will be introduced in v2 once the ABS-EE and SLOOS pages
  establish the chart pattern.
- **About page**: Not in scope for v1. The landing page carries a brief
  "curious person with too many datasets" voice bio inline. A full about page
  is deferred.
- **Chart library**: Observable Plot is the primary chart library. It integrates
  natively with Observable JS and produces clean, minimal, data-forward output
  matching the visual design principle. D3 is permitted for custom layouts that
  Observable Plot cannot produce.
- **Mobile interactivity**: Live charts on mobile are read-only. No tap-to-filter
  or pan/zoom interactions are required for v1. Charts are responsive in size
  but not interactive on touch.
- **Post types**: Five types are recognized in content but not enforced by the
  system: deep dive, signal watch, explainer, credit risk article, raw notebook.
  These are informal labels in the post frontmatter, not a hard content taxonomy.
  Deep analytical dives (notebook-style, showing all the work) are the primary
  content type. Posts should feel like reading someone's actual analysis session,
  not a polished publication.
- **Dashboard purpose**: The ABS-EE and SLOOS dashboards exist to demonstrate
  the data work — the reader should understand that someone spent real time
  downloading, parsing, and structuring this data. The dashboard is proof of
  work, not just a pretty chart.
- **Site personality**: Lowkey, analytical, quietly smart. The aesthetic should
  feel like a focused work session — dark, calm, unhurried. Not a tech portfolio,
  not a fintech product. A person's notebook, made public.
