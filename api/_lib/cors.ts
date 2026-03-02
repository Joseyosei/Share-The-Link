import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Allowed origins for CORS.
 * Only your production domain and localhost for development.
 */
const ALLOWED_ORIGINS = [
  "https://share-the-link.vercel.app",
  "https://www.sharethelink.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

/**
 * Sets CORS headers restricted to allowed origins only.
 * Returns true if it handled an OPTIONS preflight (caller should return early).
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || "";

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // No CORS header = browser blocks the request
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS[0]);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }

  return false;
}
