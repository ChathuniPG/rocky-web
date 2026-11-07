"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { feedHeaderClasses, feedItemClasses } from "@/features/feed/feed-layout";
import { FeedPostSkeleton } from "@/features/feed/feed-post-skeleton";
import { useTranslations } from "@/i18n/i18n-provider";

const NAV_ENTRY_COUNT = 7;

/**
 * Full-page placeholder shaped like the signed-in layout, shown while the
 * current user loads, so protected content never flashes before the session
 * is confirmed (ADR-013).
 */
export function AppShellSkeleton() {
  const t = useTranslations();

  return (
    <div aria-busy="true" className="mx-auto flex min-h-dvh w-full 2xl:max-w-400">
      <p role="status" className="sr-only">
        {t("auth.loadingSession")}
      </p>
      <div
        aria-hidden="true"
        className="sticky top-0 flex h-dvh w-19 shrink-0 flex-col gap-1 border-r px-3 py-4 xl:w-64"
      >
        <div className="mb-6 flex h-12 items-center gap-3 px-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <Skeleton className="hidden h-5 w-28 xl:block" />
        </div>
        {Array.from({ length: NAV_ENTRY_COUNT }, (_, index) => (
          <div key={index} className="flex h-12 items-center gap-4 px-3">
            <Skeleton className="size-6 shrink-0 rounded-md" />
            <Skeleton className="hidden h-4 w-24 xl:block" />
          </div>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        {/* Shaped like the Home feed, the page most sessions start on. */}
        <div aria-hidden="true" className={feedHeaderClasses}>
          <div className="mx-auto flex h-full max-w-4xl items-center px-4 lg:px-6">
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
        <div className={feedItemClasses}>
          <FeedPostSkeleton />
        </div>
      </div>
    </div>
  );
}
