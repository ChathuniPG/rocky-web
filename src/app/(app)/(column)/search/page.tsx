import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { SearchPageContent, SearchPageSkeleton } from "@/features/search/search-page-content";
import { getTranslations } from "@/i18n/server";
import { TranslatedText } from "@/i18n/translated-text";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.search.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * User search (FR-SRCH-01..04). The query and filter come from the URL, which is
 * only known at request time, so the part that reads them streams in behind a
 * skeleton (useSearchParams needs a Suspense boundary under cacheComponents).
 */
export default function SearchPage() {
  return (
    <>
      <PageHeader title={<TranslatedText id="pages.search.title" />} />
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchPageContent />
      </Suspense>
    </>
  );
}
