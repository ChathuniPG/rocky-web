"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/use-in-view";
import { useTranslations } from "@/i18n/i18n-provider";

type InfiniteListFooterProps = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Whether the last attempt to load the next page failed. */
  isFetchNextPageError: boolean;
  fetchNextPage: () => void;
  /** Label of the fallback button, e.g. "Load more posts". */
  loadMoreLabel: string;
  /** Shown after the last page, e.g. "You're all caught up". Nothing is shown when omitted. */
  endLabel?: string;
};

/**
 * Bottom of an infinite list (FR-FEED-07). An invisible sentinel loads the next
 * page as it nears the viewport; a "Load more" button does the same for
 * keyboard users and browsers without IntersectionObserver. After a failed page
 * it waits for a manual retry instead of retrying in a loop; after the last
 * page it shows an end marker.
 */
export function InfiniteListFooter({
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  fetchNextPage,
  loadMoreLabel,
  endLabel,
}: InfiniteListFooterProps) {
  const t = useTranslations();
  // Re-created after every page (enabled flips while fetching), so a sentinel that
  // is still in view after a short page triggers the next one too.
  const sentinelRef = useInView({
    onEnter: fetchNextPage,
    rootMargin: "600px 0px",
    enabled: hasNextPage && !isFetchingNextPage && !isFetchNextPageError,
  });

  if (!hasNextPage) {
    if (!endLabel) return null;
    return (
      <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
        <CircleCheckIcon aria-hidden="true" className="size-4" />
        {endLabel}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      {isFetchNextPageError ? (
        <p role="alert" className="flex items-center gap-2 text-sm">
          <CircleAlertIcon aria-hidden="true" className="size-4 text-destructive" />
          {t("list.pageError")}
        </p>
      ) : null}
      <Button variant="outline" loading={isFetchingNextPage} onClick={fetchNextPage}>
        {isFetchNextPageError ? t("common.retry") : loadMoreLabel}
      </Button>
    </div>
  );
}
