---
name: field-notes-charts
description: >-
  Best practices for building beautiful, interactive Observable Plot charts in
  Ben's Field Notes (Quarto/OJS). Use whenever creating or editing a chart for
  the site — scatter/bubble, time series, ranking, composition. Captures the OJS
  gotchas, design principles, interactivity, chart framing (title above / source
  below), and the Playwright verification loop. Principles, not fixed values —
  stay creative on the specifics.
---

# field-notes-charts — make the charts genuinely beautiful

House stack: Quarto → OJS cells → `@observablehq/plot`, reading data handed over
from a Python cell via `ojs_define(...)`. These are the practices that separate a
default-looking chart from a publishable one. Treat them as a floor, not a recipe —
the exact widths, colors, and layouts should serve each chart.

## OJS gotchas that will silently break a whole cell

- **Object literals need parentheses.** `X = {a: 1}` parses as a *block* and throws
  "Unexpected token." Write `X = ({a: 1})`. This is the #1 cause of a chart cell
  dumping its source instead of rendering.
- **One binding per line.** OJS wants each `name = value` on its own line; don't
  chain with semicolons.
- **A syntax error in the definition cell kills every chart on the page** and echoes
  the source. If you see raw code where a chart should be, look for the parse error
  first, not a styling bug.
- **Plot has no radius (`r`) legend.** `plot.legend("r")` throws. Build a size legend
  as a tiny separate `Plot.plot` using the *same* `r` scale domain/range.

## Design — restraint reads as quality

- **Kill non-data ink.** For scatter/bubble charts, drop vertical gridlines; keep a
  light horizontal grid at most. Fewer ticks, chosen deliberately.
- **Fix the domains** so nothing clips at the edges — leave a little headroom past the
  max point, and give bubbles room (labels above the top row get cut otherwise).
- **A reference line teaches.** A dashed rule at a meaningful threshold (e.g. "100% of
  Tier 1 capital") with a small inline label turns a cloud of dots into an argument.
- **Font: use the body sans (DM Sans), not mono,** for axis titles and labels — mono
  reads like a terminal. Keep it consistent across every chart on the page via one
  shared `FONT` constant.
- **House palette:** a steel/neutral for the crowd, one accent (orange) to highlight the
  banks/points the story is about, blue as the primary series color. Highlighted points
  get full opacity + a darker stroke; the crowd gets lower opacity so it recedes.

## Frame every chart the same way

- **Title block above:** a small mono uppercase kicker (`FIGURE 1 · THE MARKET`), a serif
  title that states the *finding* (not the variable names), and a one-line sans subtitle
  explaining the encoding/axes.
- **Source line below,** separated by a hairline rule: `Source:` + dataset/field + period,
  and an italic note on whether it's real vs. illustrative and who computed it.
- The title carries the insight; the caption carries the provenance. Don't merge them.

## Interactivity

- **Hover tooltips** on the marks that carry detail (`channels` + `tip`), formatted for
  humans ($bn, %, $T) — not raw column values.
- **Curate fixed labels** for the handful of notable points; let hover cover the rest.
  Labeling everything is noise. Place fixed labels by direction (above / below / left /
  right groups) so they don't collide, rather than one global offset.

## Width & layout

- **Fill the text column width** for the hero chart; smaller charts can be narrower but
  should be *centered*, never left-hugging with a dead gap.
- **Do NOT use `//| column: page`** to widen a chart — it shifts the whole article's
  layout left. Size the chart to the column instead and let `svg { max-width: 100% }`
  keep it responsive.

## Data integrity (the part that makes it trustworthy)

- **Roll subsidiaries up to the reporting entity** before plotting (many firms file through
  several bank subs — plotting subs double-counts and duplicates labels). Work the rollup
  explicitly; don't hand-wave it.
- **Label the basis and never mix levels** in one ratio (e.g. bank-level vs. holding-company).
- **Separate real data from synthetic samples** on disk and in captions — a public-data brand
  can't let an illustrative series masquerade as real.

## Show the work

- When a metric is non-obvious, add a short **"show the work"** passage: executed cells with
  **visible code and intermediate output** (`#| echo: true`, `#| code-fold: false`), worked on
  one concrete example, ending at the single number that becomes one mark on the chart.
- Prefer this over prose-only description — readers want to see the computation, not be told
  it happened.

## Always verify in a real browser (Playwright)

- Render, then drive the page headless: screenshot each figure, **hover a mark to confirm the
  tooltip fires**, and check for `.observablehq--error` boxes (0 = good).
- Downscale tall screenshots before viewing. Never trust a chart you haven't seen rendered.
- Code blocks: ensure token colors are dark enough to read on the light code background —
  the bundled highlight themes wash out plain identifiers.
