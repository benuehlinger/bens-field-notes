// Ben's Field Notes — Shared Observable JS utilities
// Imported into chart pages via: import { loadDB, r2Url, chartError, asOf } from "/styles/ojs-utils.js"

import { DuckDBClient } from "npm:@duckdb/duckdb-wasm";

/**
 * Initialize a DuckDB-WASM client.
 * Shared across all chart cells on a page — call once per page load.
 */
export const db = await DuckDBClient.of({});

/**
 * Build a full R2 URL from a Hive-partitioned prefix.
 * r2Base comes from the Quarto site param `r2-base-url`,
 * injected by the Cloudflare Worker as a signed or plain URL.
 *
 * @param {string} r2Base - Base URL from params["r2-base-url"]
 * @param {string} prefix - R2 path prefix, e.g. "abs_ee/curated/asset_class=autoloan"
 * @returns {string} Full glob URL for DuckDB read_parquet()
 */
export function r2Url(r2Base, prefix) {
  if (!r2Base) throw new Error("R2 base URL not configured — check site params.");
  return `${r2Base.replace(/\/$/, "")}/${prefix.replace(/^\//, "")}/*.parquet`;
}

/**
 * Format an as-of date for chart captions.
 * @param {Date|string} date
 * @returns {string} e.g. "As of Apr 2026"
 */
export function asOf(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `As of ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}

/**
 * Render a styled error state when a chart fails to load.
 * Returns an HTML element — use as chart output when data is unavailable.
 * @param {string} message
 * @returns {HTMLElement}
 */
export function chartError(message = "Data unavailable") {
  const el = document.createElement("div");
  el.className = "chart-error";
  el.innerHTML = `<span>⚠</span><span>${message} — check R2 connection or try refreshing.</span>`;
  return el;
}

/**
 * Render a loading skeleton while a query runs.
 * @param {string} label - e.g. "Loading autoloan data..."
 * @returns {HTMLElement}
 */
export function chartLoading(label = "Loading data...") {
  const el = document.createElement("div");
  el.className = "chart-loading";
  el.innerHTML = `<span>◌</span><span>${label}</span>`;
  return el;
}
