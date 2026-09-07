import type { NextConfig } from "next";
import path from "node:path";

/**
 * The rewrite below appends "/api/:path*" itself, so BACKEND_URL must be the
 * bare origin (e.g. "https://scaler-aws-u8tk.onrender.com"), not something
 * already ending in "/api" -- otherwise every request gets proxied to a
 * doubled "/api/api/..." path, which doesn't match any FastAPI route and
 * comes back 404. Strip a trailing "/api" (and any trailing slash) so a
 * misconfigured env var can't silently break every API call in production.
 */
function normalizeBackendUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "").replace(/\/api$/i, "");
}

const BACKEND_URL = normalizeBackendUrl(process.env.BACKEND_URL || "http://127.0.0.1:8000");

const nextConfig: NextConfig = {
  // `standalone` output is only for the self-hosted Docker build (see
  // frontend/Dockerfile, which copies .next/standalone). Vercel has its own
  // build tracing/packaging pipeline and explicitly does not support
  // `output: "standalone"` -- enabling it there breaks Vercel's
  // onBuildComplete step (it can't find next-server.js.nft.json in the
  // location it expects). Vercel sets the VERCEL env var on every build, so
  // use that to skip standalone output there while keeping it for Docker.
  output: process.env.VERCEL ? undefined : "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
