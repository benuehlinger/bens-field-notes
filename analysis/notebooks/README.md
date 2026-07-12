# Developer notebooks

Notebooks that reproduce the analyses behind the articles, from data source to result.
Not part of the site render (Quarto only renders `posts/**/*.ipynb`).

- `private-credit-explorer.ipynb` — the full bank private-credit pipeline. Part 1 pulls
  quarterly Call Report data from the FDIC BankFind financials API and builds the panel
  (equivalent to `analysis/pull_call_reports.py`). Part 2 aggregates it into the market
  total and the per-bank NDFI ÷ Tier 1 concentration metric (equivalent to
  `analysis/aggregate_ndfi.py`). Each markdown cell states the source, the field codes,
  and the calculation. Requires internet for the Part 1 API calls.

**Run in Cursor:** open the `.ipynb`, click *Select Kernel* (top-right) → the `.venv`
Python, then Shift+Enter through the cells. Files matching `*-scratch.ipynb` are
gitignored for local experimentation.
