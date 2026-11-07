"use client";

import { useCallback, useId, useState } from "react";

import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type ExpandableCaptionProps = {
  text: string;
  className?: string;
  /** Classes for the "more"/"less" button, e.g. a focus ring that shows on the media scrim. */
  toggleClassName?: string;
};

/**
 * A caption clamped to two lines with a "more"/"less" toggle (FR-FEED-10). The
 * toggle only appears when the text really is cut off, measured after layout
 * and again whenever the caption is resized. Plain text: React escapes it, and
 * the author's line breaks are kept.
 */
export function ExpandableCaption({ text, className, toggleClassName }: ExpandableCaptionProps) {
  const t = useTranslations();
  const captionId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);

  // Measured only while collapsed: once expanded nothing overflows, but "less" must stay.
  const measureRef = useCallback(
    (element: HTMLParagraphElement | null) => {
      if (!element || isExpanded) return;
      const measure = () => setIsClamped(element.scrollHeight > element.clientHeight + 1);
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    },
    [isExpanded],
  );

  return (
    <div className={cn("flex min-h-0 flex-col items-start gap-1", className)}>
      <p
        id={captionId}
        ref={measureRef}
        className={cn(
          "text-sm break-words whitespace-pre-line",
          isExpanded ? "min-h-0 overflow-y-auto" : "line-clamp-2",
        )}
      >
        {text}
      </p>
      {isExpanded || isClamped ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={captionId}
          onClick={() => setIsExpanded((value) => !value)}
          className={cn(
            "rounded-sm text-sm font-semibold underline-offset-2 outline-none hover:underline focus-visible:ring-2 active:opacity-80",
            toggleClassName,
          )}
        >
          {t(isExpanded ? "post.caption.less" : "post.caption.more")}
        </button>
      ) : null}
    </div>
  );
}
