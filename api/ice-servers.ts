import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "./_lib/cors.js";

/**
 * GET /api/ice-servers
 *
 * Returns WebRTC ICE server configuration including TURN servers.
 * TURN credentials are kept server-side via environment variables.
 *
 * Environment variables (set in Vercel dashboard):
 *   TURN_SERVER_URLS  – comma-separated TURN URLs
 *                       e.g. "turn:relay.example.com:3478,turns:relay.example.com:5349"
 *   TURN_USERNAME     – TURN credential username
 *   TURN_CREDENTIAL   – TURN credential password
 *
 * When no env vars are set, falls back to public STUN servers only.
 * Metered.ca free TURN is included as a development fallback when
 * TURN_SERVER_URLS is not configured.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const iceServers: RTCIceServer[] = [
    // Reliable public STUN servers
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ];

  const turnUrls = process.env.TURN_SERVER_URLS;
  const turnUsername = process.env.TURN_USERNAME;
  const turnCredential = process.env.TURN_CREDENTIAL;

  if (turnUrls && turnUsername && turnCredential) {
    // Production TURN servers from environment variables
    const urls = turnUrls.split(",").map((u) => u.trim()).filter(Boolean);
    iceServers.push({
      urls,
      username: turnUsername,
      credential: turnCredential,
    });
  } else {
    // Free public TURN relay for development / demo
    // These are open relay servers from Metered (openrelayproject)
    // For production, set up Cloudflare TURN, Twilio, or Xirsys
    iceServers.push(
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turns:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    );
  }

  // Cache for 5 minutes — credentials don't change often
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return res.status(200).json({ iceServers });
}

interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}
