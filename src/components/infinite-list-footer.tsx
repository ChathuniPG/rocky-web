"use client";

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { useFocusHandoff } from "@/hooks/use-focus-handoff";
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
 * page it shows an end marker. If the button had keyboard focus when the last
 * page arrived, focus moves to the end marker instead of falling to the page.
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
  const endRef = useRef<HTMLParagraphElement>(null);
  const focusHandoff = useFocusHandoff(hasNextPage, endRef);

  if (!hasNextPage) {
    // Without a visible end label, a screen-reader-only marker still gives focus
    // somewhere to land (and says why the button went away).
    if (!endLabel) {
      return (
        <p ref={endRef} tabIndex={-1} className="sr-only">
          {t("list.end")}
        </p>
      );
    }
    return (
      <p
        ref={endRef}
        tabIndex={-1}
        className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground outline-none"
      >
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
      <Button
        variant="outline"
        loading={isFetchingNextPage}
        onClick={fetchNextPage}
        {...focusHandoff}
      >
        {isFetchNextPageError ? t("common.retry") : loadMoreLabel}
      </Button>
    </div>
  );
}
