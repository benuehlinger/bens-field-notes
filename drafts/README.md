# Draft Notebooks

Local Jupyter drafts. Everything here is **gitignored except** this README and `skeleton-post.ipynb`.

## Quick start

```bash
cp drafts/skeleton-post.ipynb drafts/my-topic.ipynb
jupyter lab drafts/my-topic.ipynb
quarto preview drafts/my-topic.ipynb
```

Set `R2_BASE_URL` in `.env.local` (or export it) so notebooks can reach the data lake at render time.

## Publish to the site

1. Move/copy to `posts/YYYY-MM-DD-slug/index.ipynb`
2. Update the Raw YAML cell (`title`, `date`, `description`)
3. Render: `quarto render posts/YYYY-MM-DD-slug/index.ipynb`
4. Commit and push — Cloudflare Pages runs the same render

**Live example:** [ABS-EE From the Lake](../posts/2026-06-05-abs-ee-from-the-lake/index.ipynb) — pulls catalog + loan Parquet from R2 via DuckDB at build time.

## Python deps

```bash
pip install -r requirements-notebooks.txt
```

Used by notebook posts at render time (`duckdb`, `pandas`, `matplotlib`). The Cloudflare build script installs these automatically.
