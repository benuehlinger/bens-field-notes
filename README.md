# Ben's Field Notes

A personal knowledge space for **learning AI engineering, keeping up with the field, and getting involved**. Built with Quarto and portable files. The visual direction is minimal and technical, inspired by Vercel, with the questions and experiments of a personal journal.

## Work on the site

```sh
quarto preview --no-browser
```

`quarto render` produces `_site/`. A pre-render script generates the topic map, twelve subject pages, watchlist, participation routes and source library from `content/`. No notebook or model API is executed by that generator.

## Where to edit

- `index.qmd`: the journal's front page.
- `ai-engineering/investigations/`: authored inquiries and, later, notebook stories.
- `content/areas.json`: subjects, relationships, source links and topic-matching terms.
- `content/questions.json`: starting questions and connections to investigations.
- `content/sources.json`: the canonical annotated sources, participation routes and verification dates.
- `scripts/build-knowledge.py`: renders those records into Quarto pages. Edit records rather than generated pages.
- `styles/`: the visual system; `assets/knowledge.js`: progressive source filtering.

The catalog was initially imported from Deep Dives. This repository is now the working source for the website; it does not depend on Obsidian or synchronize edits back into it.

## Notebook stories

Read [the notebook workflow](docs/NOTEBOOK-WORKFLOW.md) before starting an experiment. Ben wants to choose the problem, then work through **one block at a time in VS Code**. The first inquiry is smolagents versus LangGraph, including overlap with T3 Code. No notebook has been generated yet.

## Publishing and history

The GitHub Actions workflow builds Quarto and deploys `_site/` to Cloudflare Pages. A clean output directory prevents retired pages from carrying into a new deployment. The repository and published site are public.

The pre-pivot site is recoverable at branch `archive/before-ai-engineering-20261125` (commit `7400d27`). The finance articles are removed from the active site. `analysis/`, `worker/` and historical specs remain retired infrastructure; none is required by the AI engineering pages. An existing uncommitted finance notebook and untracked local skills were preserved.
