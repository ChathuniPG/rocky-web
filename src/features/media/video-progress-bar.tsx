"use client";

import type { KeyboardEvent } from "react";

import { Slider } from "@/components/ui/slider";
import { useTranslations } from "@/i18n/i18n-provider";

import { SEEK_STEP_SECONDS, formatMediaTime } from "./video-preferences";

type VideoProgressBarProps = {
  currentTime: number;
  /** NaN or 0 until the video's metadata has loaded. */
  duration: number;
  onSeek: (time: number) => void;
};

const SEEK_KEYS: Record<string, number> = {
  ArrowLeft: -SEEK_STEP_SECONDS,
  ArrowDown: -SEEK_STEP_SECONDS,
  ArrowRight: SEEK_STEP_SECONDS,
  ArrowUp: SEEK_STEP_SECONDS,
};

/**
 * A thin seekable progress bar along the bottom edge of a video (FR-FEED-09).
 * Click or drag to seek; the touch target is taller than the visible line,
 * which thickens on hover and focus. It is a slider, so screen readers hear
 * "0:12 of 0:30". The arrow keys skip 5 seconds, like the player's shortcuts,
 * rather than the slider's fine drag step.
 */
export function VideoProgressBar({ currentTime, duration, onSeek }: VideoProgressBarProps) {
  const t = useTranslations();
  const hasDuration = Number.isFinite(duration) && duration > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    const delta = SEEK_KEYS[event.key];
    if (delta === undefined || event.altKey || event.ctrlKey || event.metaKey) return;
    // Handled here, so Radix (which skips prevented events) doesn't also step the slider.
    event.preventDefault();
    onSeek(currentTime + delta);
  }

  return (
    <Slider
      min={0}
      max={hasDuration ? duration : 1}
      step={0.1}
      value={[hasDuration ? Math.min(currentTime, duration) : 0]}
      disabled={!hasDuration}
      onValueChange={([next]) => {
        if (next !== undefined) onSeek(next);
      }}
      onKeyDown={handleKeyDown}
      className="group/progress absolute inset-x-0 bottom-0 h-3 cursor-pointer data-disabled:cursor-default data-disabled:opacity-100"
      trackClassName="rounded-none bg-white/30 transition-[height] data-horizontal:h-0.75 group-hover/progress:data-horizontal:h-1.5 group-focus-within/progress:data-horizontal:h-1.5 motion-reduce:transition-none"
      rangeClassName="bg-primary"
      thumbClassName="size-3 border-0 bg-white opacity-0 ring-white/60 group-hover/progress:opacity-100 focus-visible:opacity-100"
      thumbProps={{
        "aria-label": t("post.video.progress"),
        "aria-valuetext": t("post.video.progressValue", {
          current: formatMediaTime(currentTime),
          total: formatMediaTime(hasDuration ? duration : 0),
        }),
      }}
    />
  );
}
