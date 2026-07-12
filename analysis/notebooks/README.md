# Developer notebooks — scratch / human-in-the-loop

Rough sandboxes for exploring the data behind the articles. These are **not** part
of the site render (Quarto only renders `posts/**/*.ipynb`), so edit and break them
freely.

- `private-credit-explorer.ipynb` — walks the bank private-credit pipeline cell by
  cell: raw Call Report data → holding-company rollup → concentration metric → chart.
  Reads the committed parquet in `../outputs/`.

**Open in Cursor:** open the `.ipynb`, click *Select Kernel* (top-right) → the `.venv`
Python, then Shift+Enter through the cells. Want a throwaway copy? Just duplicate the
file — anything matching `*-scratch.ipynb` is gitignored.
