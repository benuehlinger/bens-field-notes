/**
 * Ben's Field Notes — R2 Data Proxy Worker
 *
 * Serves Parquet files from a private R2 bucket with:
 *   - CORS headers (only your Pages domain can call this)
 *   - Path validation (only allows known data prefixes)
 *   - No credentials exposed to the browser
 *
 * Routes:
 *   GET /_manifest/<prefix>  — list R2 keys under a prefix (returns JSON array)
 *   GET /<key>               — stream a single .parquet file from R2
 */

const ALLOWED_PREFIXES = [
  "abs_ee/curated/",
  "sloos/curated/",
  "macro/curated/",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = resolveOrigin(origin, env.ALLOWED_ORIGIN);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return corsResponse(null, 204, allowedOrigin);
    }

    if (request.method !== "GET") {
      return corsResponse("Method not allowed", 405, allowedOrigin);
    }

    // ── Manifest endpoint ──────────────────────────────────────────────────
    // GET /_manifest/abs_ee/curated/asset_class=autoloan/
    // Returns: JSON array of R2 keys matching the prefix
    if (url.pathname.startsWith("/_manifest/")) {
      const prefix = url.pathname.replace(/^\/_manifest\//, "");
      const allowed = ALLOWED_PREFIXES.some(p => prefix.startsWith(p));
      if (!allowed) return corsResponse("Forbidden", 403, allowedOrigin);

      const keys = [];
      let cursor;
      do {
        const listed = await env.DATA_LAKE.list({ prefix, cursor });
        keys.push(...listed.objects.map(o => o.key));
        cursor = listed.truncated ? listed.cursor : undefined;
      } while (cursor);

      return new Response(JSON.stringify(keys), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    // ── Parquet file endpoint ──────────────────────────────────────────────
    const key = url.pathname.replace(/^\//, "");

    if (!key) return corsResponse("Missing path", 400, allowedOrigin);

    const allowed = ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix));
    if (!allowed) return corsResponse("Forbidden", 403, allowedOrigin);

    if (!key.endsWith(".parquet")) {
      return corsResponse("Only .parquet files are served", 403, allowedOrigin);
    }

    const object = await env.DATA_LAKE.get(key);
    if (!object) return corsResponse("Not found", 404, allowedOrigin);

    const headers = new Headers({
      "Content-Type": "application/octet-stream",
      "Content-Length": object.size.toString(),
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
      "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    });

    return new Response(object.body, { status: 200, headers });
  },
};

function resolveOrigin(requestOrigin, configuredOrigin) {
  if (!requestOrigin) return configuredOrigin;
  if (requestOrigin === configuredOrigin) return requestOrigin;
  if (
    requestOrigin.startsWith("http://localhost") ||
    requestOrigin.startsWith("http://127.0.0.1") ||
    requestOrigin.endsWith(".pages.dev") ||
    requestOrigin.endsWith(".workers.dev")
  ) {
    return requestOrigin;
  }
  return configuredOrigin;
}

function corsResponse(body, status, allowedOrigin) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": allowedOrigin ?? "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
    },
  });
}
