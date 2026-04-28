# Draft Notebooks

This folder contains local development notebooks for iterative analysis before publishing.

## Jupyter skeleton (committed)

- **`skeleton-post.ipynb`** — Quarto-ready notebook: first cell is **Raw** YAML, then Markdown + Python cells. Duplicate it for private drafts (`cp drafts/skeleton-post.ipynb drafts/my-topic.ipynb`); copies stay untracked except this file and `README.md`.
- **Preview:** `quarto preview drafts/skeleton-post.ipynb` (or your copy’s path) from the repo root.

## Workflow

### 1. Create a Draft

```bash
# Create a new draft notebook
cp drafts/sample-analysis.qmd drafts/my-new-analysis.qmd
```

### 2. Develop Iteratively 

**Option A: VS Code/Cursor with Quarto extension**
- Open the `.qmd` file in VS Code/Cursor
- Use "Run Cell" buttons to execute Python/OJS cells
- Preview with `Cmd+Shift+K` or the Preview button

**Option B: Jupyter Lab**
```bash
# Convert to Jupyter notebook for cell-by-cell execution
quarto convert drafts/my-analysis.qmd --to ipynb
jupyter lab drafts/my-analysis.ipynb
# Convert back when done
quarto convert drafts/my-analysis.ipynb --to qmd
```

**Option C: Quarto Preview**
```bash
# Live preview while editing
quarto preview drafts/my-analysis.qmd
```

### 3. Preview Your Draft

```bash
# Render the draft to see how it looks
quarto render drafts/my-analysis.qmd
open _site/drafts/my-analysis.html
```

### 4. Publish When Ready

```bash
# Convert draft to publishable post
python scripts/publish-draft.py drafts/my-analysis.qmd

# Review the generated post
code posts/2026-04-27-my-analysis/index.qmd

# Render and commit when satisfied
quarto render posts/2026-04-27-my-analysis/index.qmd
git add posts/2026-04-27-my-analysis/
git commit -m "feat(post): add my analysis"
git push
```

## Features

### Python + Observable JS
- Full Python data analysis capabilities
- Interactive Observable JS visualizations 
- Both work together in the same notebook

### Data Integration
- Access to R2 data via your existing patterns
- DuckDB for SQL-like analysis
- Pandas/NumPy for data manipulation

### Draft-Specific Sections
The sample includes sections for:
- **Analysis Notes** - quick thoughts as you work
- **Next Steps** - track follow-up ideas  
- **Conversion Notes** - reminders for publishing

These sections are automatically removed when publishing.

## Tips

1. **Keep drafts local** - they're in `.gitignore` by default
2. **Use descriptive cell outputs** - helps when converting to narrative
3. **Add markdown notes** between code cells as you work
4. **Test both Python and OJS** - make sure everything renders
5. **Preview frequently** - catch issues early

## Data Sources

Access the same data as your dashboards:
```python
# Example: Load from R2 via DuckDB (adapt to your setup)
import duckdb
conn = duckdb.connect()
conn.execute("SET s3_region='auto'")
# conn.execute("SET s3_endpoint='your-r2-endpoint'")
# df = conn.execute("SELECT * FROM 'your-data-path'").fetchdf()
```

```{ojs}
// Example: Observable JS data loading
// r2Base = "https://your-r2-worker.workers.dev"
// data = FileAttachment("data.json").json()
```