/**
 * Ben's Field Notes — R2 Data Proxy Worker
 *
 * Serves Parquet files from a private R2 bucket with:
 *   - CORS headers (only your Pages domain can call this)
 *   - Path validation (only allows known data prefixes)
 *   - No credentials exposed to the browser
 *
 * The browser calls:
 *   GET https://bens-field-notes-r2.YOUR-SUBDOMAIN.workers.dev/abs_ee/curated/.../*.parquet
 *
 * The Worker fetches from private R2 and streams the response back.
 */

// Allowed R2 path prefixes — requests outside these are rejected with 403
const ALLOWED_PREFIXES = [
  "abs_ee/curated/",
  "sloos/curated/",
  "macro/curated/",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return corsResponse(null, 204, env.ALLOWED_ORIGIN);
    }

    // Only GET allowed
    if (request.method !== "GET") {
      return corsResponse("Method not allowed", 405, env.ALLOWED_ORIGIN);
    }

    // Strip leading slash to get the R2 key
    const key = url.pathname.replace(/^\//, "");

    if (!key) {
      return corsResponse("Missing path", 400, env.ALLOWED_ORIGIN);
    }

    // Validate against allowed prefixes
    const allowed = ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix));
    if (!allowed) {
      return corsResponse("Forbidden", 403, env.ALLOWED_ORIGIN);
    }

    // Only serve Parquet files
    if (!key.endsWith(".parquet")) {
      return corsResponse("Only .parquet files are served", 403, env.ALLOWED_ORIGIN);
    }

    // Fetch from R2
    const object = await env.DATA_LAKE.get(key);

    if (!object) {
      return corsResponse("Not found", 404, env.ALLOWED_ORIGIN);
    }

    // Stream R2 object back to browser with correct content type
    const headers = new Headers({
      "Content-Type": "application/octet-stream",
      "Content-Length": object.size.toString(),
      "Cache-Control": "public, max-age=3600",  // 1 hour cache — data doesn't change mid-day
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });

    return new Response(object.body, { status: 200, headers });
  },
};

/**
 * Helper — return a response with CORS headers.
 */
function corsResponse(body, status, allowedOrigin) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": allowedOrigin ?? "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
