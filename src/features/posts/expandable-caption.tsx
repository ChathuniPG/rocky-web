"use client";

import { useCallback, useId, useState, type CSSProperties } from "react";

import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type ExpandableCaptionProps = {
  text: string;
  className?: string;
  /** Focus ring for the "more"/"less" button and the scrollable caption, e.g. one that shows on media. */
  focusRingClassName?: string;
  /** Called when the caption is expanded or collapsed, e.g. to grow a backdrop behind it. */
  onExpandedChange?: (expanded: boolean) => void;
};

/** Which edges of the expanded caption have text scrolled out of view. */
type HiddenEdges = { top: boolean; bottom: boolean };

const NO_HIDDEN_EDGES: HiddenEdges = { top: false, bottom: false };
const EDGE_FADE = "1.5rem";

/**
 * Fades out the edges that have more text beyond them, so the reader can
 * tell the caption scrolls without a visible scrollbar.
 */
function edgeFadeMask({ top, bottom }: HiddenEdges): CSSProperties | undefined {
  if (!top && !bottom) return undefined;
  const mask = `linear-gradient(to bottom, ${top ? "transparent" : "#000"} 0, #000 ${EDGE_FADE}, #000 calc(100% - ${EDGE_FADE}), ${bottom ? "transparent" : "#000"} 100%)`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

/**
 * A caption clamped to two lines with a "more"/"less" toggle (FR-FEED-10). The
 * toggle only appears when the text really is cut off, measured after layout
 * and again whenever the caption is resized. Plain text: React escapes it, and
 * the author's line breaks are kept.
 *
 * Expanded, a long caption scrolls inside its box like TikTok's: by wheel or
 * touch, and from the keyboard because the box is then a focusable, labelled
 * region. The scrollbar is hidden; instead the edge with more text beyond it
 * fades out.
 */
export function ExpandableCaption({
  text,
  className,
  focusRingClassName,
  onExpandedChange,
}: ExpandableCaptionProps) {
  const t = useTranslations();
  const captionId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const [hiddenEdges, setHiddenEdges] = useState<HiddenEdges>(NO_HIDDEN_EDGES);
  const isScrollable = isExpanded && (hiddenEdges.top || hiddenEdges.bottom);

  // Collapsed: is the text cut off? Expanded: which edges have text beyond them?
  const measureRef = useCallback(
    (element: HTMLParagraphElement | null) => {
      if (!element) return;
      const measure = isExpanded
        ? () => {
            const top = element.scrollTop > 1;
            const bottom = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
            // Only re-render when an edge changes, not on every scroll event.
            setHiddenEdges((edges) =>
              edges.top === top && edges.bottom === bottom ? edges : { top, bottom },
            );
          }
        : () => setIsClamped(element.scrollHeight > element.clientHeight + 1);
      measure();
      if (isExpanded) element.addEventListener("scroll", measure, { passive: true });
      const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
      observer?.observe(element);
      return () => {
        element.removeEventListener("scroll", measure);
        observer?.disconnect();
      };
    },
    [isExpanded],
  );

  function toggle() {
    const next = !isExpanded;
    setIsExpanded(next);
    setHiddenEdges(NO_HIDDEN_EDGES);
    onExpandedChange?.(next);
  }

  return (
    <div className={cn("flex min-h-0 flex-col items-start gap-1", className)}>
      <p
        id={captionId}
        ref={measureRef}
        // A scrollable region must be focusable and named, so keyboard users can scroll it (WCAG 2.1.1).
        role={isScrollable ? "region" : undefined}
        aria-label={isScrollable ? t("post.caption.label") : undefined}
        tabIndex={isScrollable ? 0 : undefined}
        style={isExpanded ? edgeFadeMask(hiddenEdges) : undefined}
        className={cn(
          "text-sm break-words whitespace-pre-line",
          isExpanded
            ? cn(
                "scrollbar-none min-h-0 overflow-y-auto overscroll-contain rounded-sm outline-none",
                focusRingClassName,
              )
            : "line-clamp-2",
        )}
      >
        {text}
      </p>
      {isExpanded || isClamped ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={captionId}
          onClick={toggle}
          className={cn(
            "rounded-sm text-sm font-semibold underline-offset-2 outline-none hover:underline focus-visible:ring-2 active:opacity-80",
            focusRingClassName,
          )}
        >
          {t(isExpanded ? "post.caption.less" : "post.caption.more")}
        </button>
      ) : null}
    </div>
  );
}
