import { z } from "zod";

/**
 * Schema for server-only environment variables. Kept free of `server-only` so
 * next.config.ts can reuse it; app code must import `@/lib/env.server` instead.
 */
const serverEnvSchema = z.object({
  // The API binds to 127.0.0.1, not localhost: on Node, "localhost" can resolve to
  // ::1 first and the connection is refused.
  API_INTERNAL_URL: z
    .url({ protocol: /^https?$/ })
    .default("http://127.0.0.1:4000")
    .transform((url) => url.replace(/\/+$/, "")),
});

/** Validated server-only environment variables. */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates environment variables and fails fast with a readable message, so a
 * misconfigured deployment breaks at startup rather than on the first API call.
 */
export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Invalid server environment variables:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
