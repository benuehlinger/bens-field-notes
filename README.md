# Ben's Field Notes

Companion **data journal / site** for [**bens-data-lake**](https://github.com/YOUR_GITHUB_USER/bens-data-lake) (replace with your org/user after publishing).

- **Next.js** app — charts, narrative, exploration UI.
- **Data** lives in the lake (R2 Parquet, manifests); this repo should stay **small** — wire charts via public URLs, exported slices, or a thin API (see `docs/DATA_CONTRACT.md`).

## Quick start

```bash
cd /path/to/bens-field-notes
npm install
cp .env.example .env.local   # optional: API base URL if you add a reader API
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Spec-driven development

Use [GitHub Spec Kit](https://github.com/github/spec-kit) **in this repo** for website work (constitution → spec → plan → tasks). See `docs/SPEC_KIT.md`.

## Repo split

| Repo | Role |
|------|------|
| **bens-data-lake** | Ingest, R2, schedules, `pipelines/`, research notebooks tied to ingest |
| **bens-field-notes** (here) | Public-facing journal + dashboard routes |

First-time GitHub setup for both repos: in the lake checkout, see `docs/GITHUB_SETUP.md`.
