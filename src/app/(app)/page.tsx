import type { Metadata } from "next";

import { HomeFeed } from "@/features/feed/home-feed";
import { DocumentTitle } from "@/i18n/document-title";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.home.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/** Home feed (FR-FEED-01 to FR-FEED-08). The feed itself is a client component. */
export default function HomePage() {
  return (
    <>
      <DocumentTitle id="pages.home.title" />
      <HomeFeed />
    </>
  );
}
