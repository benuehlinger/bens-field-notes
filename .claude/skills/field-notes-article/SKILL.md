---
name: field-notes-article
description: >-
  Best practices for building a data-driven Field Notes article end to end — from
  public-data pull to lake to charts to prose with inline code. Use when drafting
  or structuring a new post that rests on real data (credit, markets, filings).
  Covers the data pipeline, provenance, the aggregate→company structure, showing
  the work, and honest limits. Principles, not a template.
---

# field-notes-article — a real-data piece, done right

The brand promise: *an outsider makes sense of an opaque market using free public
data — download it, parse it, compute it, show the code.* Every article should earn
that. These are the practices; the angle and voice are yours.

## Structure

- **Two lenses, ideally from one dataset:** read the market **in aggregate** first
  (size, growth, concentration, stress), then zoom to a **single entity**. When the
  same public field powers both (sum it → market; rank it → company), say so — that
  economy of means *is* the credibility.
- **Contrast teaches.** Two worked examples that differ in kind (e.g. rich-disclosure
  vs. infer-it) let a reader place any case in between. One example is a description;
  two are a method.
- **Hook on the concrete** (a failure, a headline, a number), then promise the method.

## Data pipeline & the lake

- **One pull script per source**, committed under `analysis/`. "Refresh each quarter"
  should become one command, not a memory.
- **Provenance travels with the data:** every real table carries `source_url`, an
  as-of/`pulled_on` date, and a `basis` label. For a public-data brand, sourcing is
  the product.
- **Commit the small derived parquet** the charts read (with a gitignore exception so
  CI can render), and keep it regenerable from the script — never hand-edit it.
- **Raw immutable, derived reproducible.** Aggregate in a script, not by hand.
- **Real ≠ sample.** Keep synthetic/illustrative data in a separate folder and never
  let it render as if it were real.
- Prefer stdlib (`urllib`) for simple public-API pulls so the venv needs no extra deps.

## Numbers must be trustworthy

- **Cross-check every headline figure against a primary source** (the entity's own
  disclosure, the regulator's aggregate). If your computed number matches three primary
  benchmarks, that beats matching any secondary estimate.
- **Pick the reporting basis deliberately and hold it** (e.g. bank-level Call Report vs.
  holding-company 10-K). Compute cross-entity comparisons on one basis; quote disclosures
  on theirs; label both; never divide one by the other.
- If you cite someone else's method/number you couldn't independently reproduce, say so
  and flag it as a follow-up rather than implying you computed it.

## Inline code — where it teaches, not everywhere

- Show the **pull recipe** (the free-API call that gets the data) and the **key formula**
  (the one division/aggregation the whole piece turns on). These are the "do it yourself"
  spine.
- Add a **"show the work"** passage for any non-obvious metric: executed, unfolded cells
  with visible code *and* intermediate output, worked on one concrete example, landing on
  the number that becomes a point on the chart.
- Keep setup/plumbing cells hidden (`echo: false`); reveal only the code that carries insight.

## Honest limits belong at the end

- Name what the data *can't* do (reporting artifacts, series that start recently,
  reported-condition ≠ truth / can't detect fraud). The caveats are not throat-clearing —
  they're what separates analysis from a hot take, and they're on-brand.

## Ship discipline

- Draft on a branch; keep `main` clean. Verify the render (and the charts, in a browser)
  before considering it done.
- Match the house voice: dry, rigorous, a little irreverent — never Bloomberg-terminal prose.
- See also **field-notes-charts** for the visualization practices.
