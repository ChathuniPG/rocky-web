import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import { parseServerEnv } from "./src/lib/server-env-schema";

/**
 * Builds the Next.js config for the given phase. A function (not an object) so the
 * dev-only component showcase can be left out of production builds entirely.
 */
export default function nextConfig(phase: string): NextConfig {
  const { API_INTERNAL_URL, FIREBASE_STORAGE_BUCKET } = parseServerEnv(process.env);
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    cacheComponents: true,
    partialPrefetching: true,
    // CLAUDE.md is the single source of AI-agent instructions; stop `next dev`
    // from re-creating AGENTS.md.
    agentRules: false,
    // `*.dev.tsx` pages (e.g. /dev/components) only exist under `next dev`.
    pageExtensions: isDevServer ? ["dev.tsx", "tsx", "ts"] : ["tsx", "ts"],
    images: {
      // Only objects in our own bucket may go through the image optimizer, so it
      // can't be used to fetch arbitrary URLs. Object names are URL-encoded
      // ("posts%2F..."), so they are a single segment after /o/. `search` is left
      // out on purpose: download URLs carry ?alt=media&token=...
      remotePatterns: [
        {
          protocol: "https",
          hostname: "firebasestorage.googleapis.com",
          pathname: `/v0/b/${FIREBASE_STORAGE_BUCKET}/o/**`,
        },
      ],
    },
    turbopack: {
      rules: {
        "*.css": {
          loaders: ["@tailwindcss/turbopack"],
          as: "*.css",
        },
      },
    },
    // ADR-004: the browser only ever calls same-origin /api/v1. In production Nginx
    // routes /api to the API before requests reach Next.js; locally this rewrite plays
    // that role (also under `next start`, so production builds can be tested locally).
    rewrites() {
      return Promise.resolve([
        {
          source: "/api/:path*",
          destination: `${API_INTERNAL_URL}/api/:path*`,
        },
      ]);
    },
  };
}
