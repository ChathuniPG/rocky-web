import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import { parseServerEnv } from "./src/lib/server-env-schema";

/**
 * Builds the Next.js config for the given phase. A function (not an object) so the
 * dev-only component showcase can be left out of production builds entirely.
 */
export default function nextConfig(phase: string): NextConfig {
  const { API_INTERNAL_URL } = parseServerEnv(process.env);
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  return {
    cacheComponents: true,
    partialPrefetching: true,
    // CLAUDE.md is the single source of AI-agent instructions; stop `next dev`
    // from re-creating AGENTS.md.
    agentRules: false,
    // `*.dev.tsx` pages (e.g. /dev/components) only exist under `next dev`.
    pageExtensions: isDevServer ? ["dev.tsx", "tsx", "ts"] : ["tsx", "ts"],
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
