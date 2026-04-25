# Ben's Field Notes

Public **Quarto** data journal companion to [**bens-data-lake**](https://github.com/benuehlinger/bens-data-lake).

- **Site:** `.qmd` notebooks + Observable JS + DuckDB-WASM charts reading Parquet from Cloudflare R2 (via a small [Worker](worker/) proxy — bucket stays private).
- **Data:** lives in the lake (R2); this repo stays small — see `docs/DATA_CONTRACT.md`.

## Local preview

```bash
brew install --cask quarto   # once
cd bens-field-notes
cp .env.example .env.local   # set R2_BASE_URL to your Worker URL
quarto preview -P "r2-base-url:${R2_BASE_URL}"   # or put the URL inline
```

Open [http://localhost:4321](http://localhost:4321).

## Cloudflare Pages (production)

In the Pages project **Build settings**:

| Setting | Value |
|---------|-------|
| **Framework preset** | None |
| **Build command** | `bash scripts/cloudflare-pages-build.sh` |
| **Build output directory** | `_site` (no leading slash) |
| **Root directory** | `/` (repo root) |
| **Environment variable** | `R2_BASE_URL` = `https://bens-field-notes-r2.<your-subdomain>.workers.dev` |

The script downloads Quarto for Linux (Cloudflare’s build image has no Quarto pre-installed).

## Worker (R2 proxy)

See [`worker/README.md`](worker/README.md). Deploy from your laptop:

```bash
cd worker
npx wrangler deploy
```

After Pages gives you a `*.pages.dev` URL, set `ALLOWED_ORIGIN` in `worker/wrangler.toml` to that URL and redeploy — otherwise the browser blocks cross-origin Parquet fetches (CORS).

## Spec-driven development

[GitHub Spec Kit](https://github.com/github/spec-kit) — constitution → spec → plan → tasks. See `docs/SPEC_KIT.md` and `specs/001-site-v1/`.

## Repo split

| Repo | Role |
|------|------|
| **bens-data-lake** | Ingest, R2, schedules, `pipelines/` |
| **bens-field-notes** (here) | Static site + Worker |
