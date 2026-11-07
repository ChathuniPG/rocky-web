import "server-only";

import { parseServerEnv } from "./server-env-schema";

/**
 * Server-only environment, validated once at module load. Importing this from a
 * client component fails the build (`server-only`), so the internal API URL can
 * never leak into the browser bundle.
 */
export const serverEnv = parseServerEnv(process.env);
