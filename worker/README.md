# R2 Data Proxy Worker

Cloudflare Worker that serves Parquet files from the private R2 data lake
to the browser-side DuckDB-WASM charts.

## Setup

### 1. Set your bucket name
Edit `wrangler.toml` and replace `YOUR_BUCKET_NAME` with your actual R2 bucket name.

### 2. Login to Cloudflare
```bash
cd worker
npx wrangler login
```
This opens a browser window — approve access.

### 3. Deploy
```bash
npx wrangler deploy
```
The Worker URL will be printed: `https://bens-field-notes-r2.YOUR-SUBDOMAIN.workers.dev`

### 4. Update ALLOWED_ORIGIN
Once you have your Cloudflare Pages URL (e.g. `https://bens-field-notes.pages.dev`),
update `wrangler.toml`:
```toml
[vars]
ALLOWED_ORIGIN = "https://bens-field-notes.pages.dev"
```
Then redeploy: `npx wrangler deploy`

### 5. Set R2_BASE_URL on Cloudflare Pages
In Cloudflare Pages → your project → Settings → Environment Variables:
```
R2_BASE_URL = https://bens-field-notes-r2.YOUR-SUBDOMAIN.workers.dev
```

### 6. Update .env.local for local dev
```
R2_BASE_URL=https://bens-field-notes-r2.YOUR-SUBDOMAIN.workers.dev
```

## How it works

The Worker sits between the browser and R2:
```
Browser (DuckDB-WASM)
  → GET /abs_ee/curated/asset_class=autoloan/file.parquet
  → Worker validates path, fetches from private R2
  → Streams Parquet bytes back to browser
  → DuckDB-WASM queries the bytes in memory
  → Observable Plot renders the chart
```

Your R2 bucket stays private. Only the Worker can read it.
The Worker only serves paths under the allowed prefixes.
