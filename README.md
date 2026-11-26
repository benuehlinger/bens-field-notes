# Ben’s Field Notes

A personal knowledge space for learning AI engineering, keeping up with the field and getting involved. Astro builds the website. Quarto renders notebook stories when they exist.

## Work on the site

Use Node 24 and install dependencies with `npm ci`.

```sh
npm run dev
```

`npm run build` creates `dist/`: the Astro pages, the portable content records, and any saved notebook stories. `npm run preview` serves the built site. Existing `.html` links are preserved with Astro’s `preserve` build format.

## Where to edit

- `src/pages/`: home, learning views, subject guides, source library and current inquiries. Regular writing can use Markdown with `src/layouts/Article.astro`.
- `src/components/Atlas.astro`: the quantitative source map.
- `src/components/Sources.astro`: the shared table and source-detail panel.
- `src/scripts/`: chart, source browser, theme and global search interactions.
- `src/styles/site.css`: shared typography, color, spacing and responsive layouts. Fonts are self-hosted.
- `content/sources.json`: the canonical 127-source collection, access notes and verification dates.
- `content/areas.json` and `content/questions.json`: subject relationships and starting questions.
- `src/lib/knowledge.mjs`: source lookup and topic membership used by both chart and filters.
- `notebooks/`: future `.ipynb` and `.qmd` notebook stories; no notebook has been created yet.

The source collection is kept in portable JSON. This repository is the website’s working source; it does not synchronize edits back into Obsidian.

## Design and verification

Read [the design direction](docs/DESIGN.md) for the intended chart-to-table experience.

```sh
npm test
npm run build
npx playwright install chromium webkit
npm run test:ui
```

The browser checks cover chart selections, filtering, sorting, source details, deep links, theme persistence, search and phone navigation. For an existing local Chrome, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable when running the browser tests.

## Notebook stories

Read [the notebook workflow](docs/NOTEBOOK-WORKFLOW.md) before creating an experiment. Ben chooses the problem and works through one block at a time in VS Code. The first inquiry is smolagents versus LangGraph, including overlap with T3 Code.

The build renders notebook files with Quarto after Astro, sharing the website’s navigation and stylesheet. Execution is disabled; publishing saved outputs and running a notebook are separate actions.

## Publishing and recovery

GitHub Actions tests and builds the site, then deploys `dist/` to the existing Cloudflare Pages project. Astro gives compiled CSS, JavaScript and fonts content-specific filenames so returning visitors receive matching assets.

The repository and published site are public. Git history preserves the prior Quarto implementation and earlier finance journal. The pre-AI site is also recoverable at `archive/before-ai-engineering-20261125` (`7400d27`). `analysis/`, `worker/` and historical finance specs are retired infrastructure, outside the website build.
