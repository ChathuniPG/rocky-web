"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { useVideoAutoplay } from "./use-video-autoplay";
import { resolvePlayerKey, type PlayerKeyTarget } from "./video-player-keys";
import {
  SEEK_STEP_SECONDS,
  VOLUME_STEP,
  clampSeekTime,
  seekBy,
  soundPreferenceStore,
  stepVolume,
  withMuteToggled,
  withVolume,
} from "./video-preferences";
import { VideoProgressBar } from "./video-progress-bar";
import { VideoSoundControl } from "./video-sound-control";

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/** What kind of element inside the player a key press went to. */
function keyTargetOf(target: EventTarget): PlayerKeyTarget {
  if (!(target instanceof Element)) return "player";
  if (target.closest(EDITABLE_SELECTOR)) return "editable";
  if (target.closest('[role="slider"]')) return "slider";
  if (target.closest("button, a")) return "button";
  return "player";
}

type VideoPlayerProps = {
  src: string;
  /** Names the player for screen readers, e.g. "Video posted by Alice". */
  label: string;
  /** Drawn over the video, above the play/pause surface and below the controls, e.g. the caption. */
  overlay?: ReactNode;
  /** Positions the sound control; defaults to the top-left corner. */
  soundControlClassName?: string;
  className?: string;
};

/**
 * The TikTok-style video player used in the feed and on the post page
 * (FR-FEED-09). It fills its positioned parent and loops. It autoplays when
 * it is the most visible video (unless the user prefers reduced motion) and
 * pauses when scrolled away or when the tab is hidden; see useVideoAutoplay.
 *
 * Clicking anywhere on the video plays or pauses it; that surface is a real
 * button, so it is also the always-available pause control (WCAG 2.2.2). The
 * sound control (top-left) and the progress bar (bottom edge) are siblings of
 * that button, not children, so using them never toggles playback. While
 * focus is inside the player, Space/K, M and the arrow keys are shortcuts;
 * elsewhere, such as the feed's Page Down navigation, keys are untouched.
 *
 * Playback, sound and time are read from the element's own events: the
 * element is the source of truth, this component only mirrors it for display.
 */
export function VideoPlayer({
  src,
  label,
  overlay,
  soundControlClassName,
  className,
}: VideoPlayerProps) {
  const t = useTranslations();
  const shortcutsId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { play } = useVideoAutoplay(videoRef, { autoplay: !reducedMotion });

  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number.NaN);

  // `timeupdate` fires only about four times a second; follow frames while playing so the bar moves smoothly.
  useEffect(() => {
    if (paused) return;
    let frame = requestAnimationFrame(function tick() {
      const video = videoRef.current;
      if (video) setCurrentTime(video.currentTime);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) play();
    else video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    soundPreferenceStore.set(withMuteToggled({ muted: video.muted, volume: video.volume }));
  }

  function changeVolume(next: number) {
    const video = videoRef.current;
    if (!video) return;
    soundPreferenceStore.set(withVolume({ muted: video.muted, volume: video.volume }, next));
  }

  function seekTo(time: number) {
    const video = videoRef.current;
    if (!video) return;
    const target = clampSeekTime(time, video.duration);
    video.currentTime = target;
    setCurrentTime(target);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Keys typed in the caption overlay (author link, "more") belong to it.
    if (event.target instanceof Element && event.target.closest("[data-video-overlay]")) return;
    const action = resolvePlayerKey({
      key: event.key,
      target: keyTargetOf(event.target),
      hasModifier: event.ctrlKey || event.altKey || event.metaKey,
      isComposing: event.nativeEvent.isComposing,
    });
    if (!action) return;
    // Stop Space and the arrows from also scrolling the page.
    event.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    const audible = video.muted ? 0 : video.volume;

    switch (action) {
      case "toggle":
        togglePlayback();
        break;
      case "mute":
        toggleMute();
        break;
      case "seekBack":
        seekTo(seekBy(video.currentTime, -SEEK_STEP_SECONDS, video.duration));
        break;
      case "seekForward":
        seekTo(seekBy(video.currentTime, SEEK_STEP_SECONDS, video.duration));
        break;
      case "volumeUp":
        changeVolume(stepVolume(audible, VOLUME_STEP));
        break;
      case "volumeDown":
        changeVolume(stepVolume(audible, -VOLUME_STEP));
        break;
    }
  }

  return (
    <div
      role="group"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn("absolute inset-0", className)}
    >
      {/* Named by the group; hidden itself so screen readers don't announce an unlabelled media element. */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        loop
        muted
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onVolumeChange={(event) => {
          setMuted(event.currentTarget.muted);
          setVolume(event.currentTarget.volume);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        className="absolute inset-0 size-full object-contain"
      />

      <button
        type="button"
        aria-label={paused ? t("post.video.play") : t("post.video.pause")}
        aria-describedby={shortcutsId}
        aria-keyshortcuts="Space K M ArrowLeft ArrowRight ArrowUp ArrowDown"
        onClick={togglePlayback}
        className="group/toggle absolute inset-0 flex cursor-pointer items-center justify-center outline-none focus-visible:ring-3 focus-visible:ring-white focus-visible:ring-inset"
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-16 items-center justify-center rounded-full bg-black/45 text-white transition-opacity motion-reduce:transition-none",
            paused
              ? // Shown after a moment, so it doesn't flash before autoplay starts.
                "opacity-100 delay-200"
              : "opacity-0 group-focus-visible/toggle:opacity-100 group-active/toggle:opacity-100",
          )}
        >
          {paused ? (
            <PlayIcon className="size-8 translate-x-0.5 fill-current" />
          ) : (
            <PauseIcon className="size-8 fill-current" />
          )}
        </span>
      </button>
      <p id={shortcutsId} className="sr-only">
        {t("post.video.shortcuts")}
      </p>

      {overlay ? <div data-video-overlay="">{overlay}</div> : null}

      <VideoSoundControl
        muted={muted}
        volume={volume}
        onToggleMute={toggleMute}
        onVolumeChange={changeVolume}
        className={soundControlClassName ?? "top-3 left-3"}
      />
      <VideoProgressBar currentTime={currentTime} duration={duration} onSeek={seekTo} />
    </div>
  );
}
