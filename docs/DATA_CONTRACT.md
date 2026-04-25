# Data Contract (Ben's Data Lake -> Ben's Field Notes)

This site reads curated outputs published by **Ben's Data Lake**.

## Contract goals

- Keep this repo small (no raw XML, no giant Parquet in git).
- Consume stable outputs (R2 keys, manifests, or exported slices).
- Preserve reproducibility (source IDs, as-of date, units visible in UI).

## Minimum contract fields per rendered series

- `source_id`
- `series_id` (or equivalent semantic key)
- `observation_date`
- `value`
- `unit` (or display-unit mapping)
- `ingested_at_utc` / manifest timestamp
- `provider_url`

## Integration patterns

1. Public R2 manifests + objects
2. Exported JSON slices committed to this repo for deterministic posts
3. Thin read-only API layer in front of the lake (future optional)

## Versioning

When chart semantics change (renamed metric, transformed values), treat as a contract version bump in docs and route notes.
