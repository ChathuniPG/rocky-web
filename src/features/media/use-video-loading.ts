"use client";

import { useEffect, type RefObject } from "react";

import { needsLoadRestart, type VideoPreload } from "./video-preload";

/** End of the last buffered range in seconds, or 0. */
function bufferedEnd(video: HTMLVideoElement): number {
  const { buffered } = video;
  return buffered.length > 0 ? buffered.end(buffered.length - 1) : 0;
}

/**
 * Manages how much of a video the browser downloads (NFR-PERF-03):
 *
 * - When `preload` becomes "auto" on a paused video whose fetch has gone idle,
 *   it calls `load()`: Chrome doesn't resume that fetch for the attribute
 *   change alone (measured for #40).
 * - When the player unmounts, or its page is hidden by React Activity, it
 *   empties `src` and calls `load()`, the standard way to make the browser
 *   drop the download and the decoder; a paused element otherwise keeps
 *   buffering. When Activity shows the page again, `src` is put back.
 */
export function useVideoLoading(
  videoRef: RefObject<HTMLVideoElement | null>,
  { src, preload }: { src: string; preload: VideoPreload },
): void {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Back from an Activity hide, where the cleanup below removed it; React won't, as the prop didn't change.
    if (video.getAttribute("src") !== src) video.setAttribute("src", src);
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [videoRef, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || preload !== "auto") return;
    const state = {
      paused: video.paused,
      networkIdle: video.networkState === HTMLMediaElement.NETWORK_IDLE,
      bufferedEnd: bufferedEnd(video),
      duration: video.duration,
    };
    if (needsLoadRestart(state)) video.load();
  }, [videoRef, preload]);
}
