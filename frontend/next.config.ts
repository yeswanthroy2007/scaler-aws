import type { NextConfig } from "next";
import path from "node:path";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

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
