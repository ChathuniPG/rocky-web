import { defineConfig } from "vitest/config";

/** Unit tests for pure logic (validation, schemas). Component tests can add a DOM environment later. */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
