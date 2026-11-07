import type { Metadata } from "next";

import { ComponentShowcase } from "./_components/component-showcase";

export const metadata: Metadata = { title: "Components (dev)" };

/**
 * Temporary visual review page for the shared components (#4). The `.dev.tsx`
 * extension is only registered under `next dev` (see next.config.ts), so this
 * route does not exist in production builds. Remove before the final release.
 */
export default function DevComponentsPage() {
  return <ComponentShowcase />;
}
