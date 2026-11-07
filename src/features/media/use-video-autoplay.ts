"use client";

import { useCallback, useEffect, useId, useRef, type RefObject } from "react";

import { videoCoordinator } from "./video-coordinator";
import { soundPreferenceStore } from "./video-preferences";

// Several steps around the 60% autoplay threshold, so "most visible" stays accurate while scrolling.
const VISIBILITY_THRESHOLDS = [0, 0.25, 0.5, 0.6, 0.75, 1];

/** Puts the viewer's sound preference on the element. */
function applySoundPreference(video: HTMLVideoElement): void {
  const { muted, volume } = soundPreferenceStore.get();
  video.volume = volume;
  video.muted = muted;
}

/**
 * Starts the video with the viewer's sound preference. Browsers may block
 * playback with sound until the user has interacted with the page; then it
 * retries muted, silently (FR-FEED-09). The stored preference is left as is,
 * and the controls show the element's real muted state.
 */
async function startPlayback(video: HTMLVideoElement, stillWanted: () => boolean): Promise<void> {
  applySoundPreference(video);
  try {
    await video.play();
  } catch (error) {
    // AbortError: paused again before playback started (e.g. scrolled away); nothing to do.
    if (!(error instanceof DOMException) || error.name !== "NotAllowedError") return;
    if (video.muted || !stillWanted()) return;
    video.muted = true;
    try {
      await video.play();
    } catch {
      // Blocked even when muted: the video stays paused and its play button stays visible.
    }
  }
}

type UseVideoAutoplayOptions = {
  /** False when the user prefers reduced motion: the video is coordinated but never started for them. */
  autoplay: boolean;
};

/**
 * Connects a video to the shared coordinator (FR-FEED-09): it autoplays when
 * it is the most visible video (at least 60%), pauses when scrolled away or
 * when the tab is hidden, and follows sound preference changes made on any
 * player. Returns `play`, for the user starting the video by hand, which also
 * pauses any other video.
 *
 * Next.js keeps visited pages mounted but hidden (React Activity), so all of
 * this lives in one effect: Activity runs its cleanup on hide, which pauses
 * and mutes the video, so a hidden page never plays or makes sound.
 */
export function useVideoAutoplay(
  videoRef: RefObject<HTMLVideoElement | null>,
  { autoplay }: UseVideoAutoplayOptions,
): { play: () => void } {
  const id = useId();
  // Read at play time, so toggling reduced motion doesn't re-register the video.
  const autoplayRef = useRef(autoplay);
  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const isActive = () => videoCoordinator.activeId() === id;

    const unregister = videoCoordinator.register(id, {
      play: () => {
        if (autoplayRef.current) void startPlayback(video, isActive);
      },
      pause: () => video.pause(),
    });

    const onPageVisibility = () =>
      videoCoordinator.setPageVisible(document.visibilityState === "visible");
    onPageVisibility();
    document.addEventListener("visibilitychange", onPageVisibility);

    // Another player changed the sound: follow it, so all controls agree.
    const unsubscribe = soundPreferenceStore.subscribe(() => applySoundPreference(video));

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const entry of entries)
                videoCoordinator.setVisibility(id, entry.intersectionRatio);
            },
            { threshold: VISIBILITY_THRESHOLDS },
          );
    observer?.observe(video);

    return () => {
      observer?.disconnect();
      unsubscribe();
      document.removeEventListener("visibilitychange", onPageVisibility);
      unregister();
      video.pause();
      video.muted = true;
    };
  }, [videoRef, id]);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    videoCoordinator.claim(id);
    void startPlayback(video, () => videoCoordinator.activeId() === id);
  }, [videoRef, id]);

  return { play };
}
