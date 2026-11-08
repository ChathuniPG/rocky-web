import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type VideoPlaceholderProps = {
  /** The same name the player would have, e.g. "Video posted by Alice". */
  label: string;
  /** The caption overlay, kept so the post's links and layout don't change. */
  overlay?: ReactNode;
  className?: string;
};

/**
 * Stands in for a feed video far from the screen (NFR-PERF-03): a black frame
 * with the post's overlay and no media element, so nothing is downloaded or
 * decoded for it. The feed swaps in the real VideoPlayer as the post comes
 * near. The profile grid's VideoStill isn't reused: the API has no poster
 * image, so that still is itself a `<video>` that fetches the file.
 */
export function VideoPlaceholder({ label, overlay, className }: VideoPlaceholderProps) {
  return (
    <div role="group" aria-label={label} className={cn("absolute inset-0 bg-black", className)}>
      {overlay ? <div data-video-overlay="">{overlay}</div> : null}
    </div>
  );
}
