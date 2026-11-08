"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";

import type { FeedStepState } from "./feed-step";

type FeedStepControlsProps = FeedStepState & {
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * The round Previous/Next post buttons beside the Home feed (FR-FEED-10),
 * shown from 1024px where the feed has no scrollbar. They stay centred on
 * screen at the right edge of the feed column (sticky inside a full-height
 * rail), so they never cover the media or the action column.
 */
export function FeedStepControls({
  previousDisabled,
  nextDisabled,
  nextLoading,
  onPrevious,
  onNext,
}: FeedStepControlsProps) {
  const t = useTranslations();
  return (
    <div className="pointer-events-none absolute inset-y-0 right-4 hidden lg:block">
      <nav
        aria-label={t("feed.stepNavigation")}
        className="pointer-events-auto sticky top-1/2 flex -translate-y-1/2 flex-col gap-3"
      >
        <Button
          variant="secondary"
          size="icon-lg"
          className="rounded-full shadow-sm"
          aria-label={t("feed.previousPost")}
          aria-keyshortcuts="ArrowUp"
          disabled={previousDisabled}
          // Pressing it can reach the first post and disable it; keep focus on it (2.4.3).
          focusableWhenDisabled
          onClick={onPrevious}
        >
          <ChevronUpIcon aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="icon-lg"
          className="rounded-full shadow-sm"
          aria-label={t("feed.nextPost")}
          aria-keyshortcuts="ArrowDown"
          disabled={nextDisabled}
          focusableWhenDisabled
          loading={nextLoading}
          onClick={onNext}
        >
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}
