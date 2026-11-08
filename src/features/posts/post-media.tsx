"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { VideoPlaceholder } from "@/features/media/video-placeholder";
import { VideoPlayer } from "@/features/media/video-player";
import type { VideoPreload } from "@/features/media/video-preload";
import { useTranslations } from "@/i18n/i18n-provider";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/*
 * `sizes` hints for next/image, so it picks a fitting width (NFR-PERF-03).
 * From 768px the feed's 9:16 frame is as tall as the viewport minus the header
 * and padding (5.5rem), so its width follows the height, not the viewport
 * width; only portrait screens are limited by the column instead.
 * The post page's media pane takes the space left of the comments panel; from
 * 1536px the shell is capped at 1600px, leaving 576px (1600 - 256 sidebar -
 * 320 right panel - 448 comments panel).
 */
/** Image `sizes` for the feed's media frame (FR-FEED-10). */
export const FEED_MEDIA_SIZES =
  "(min-width: 768px) and (orientation: portrait) 70vw, (min-width: 768px) calc((100vh - 5.5rem) * 0.5625), 100vw";
/** Image `sizes` for the post page's media pane (FR-POST-07). */
export const POST_PAGE_MEDIA_SIZES = "(min-width: 1536px) 576px, (min-width: 1024px) 60vw, 100vw";

type PostMediaProps = {
  post: Pick<Post, "mediaUrl" | "mediaType" | "author">;
  /** See FEED_MEDIA_SIZES and POST_PAGE_MEDIA_SIZES. */
  sizes: string;
  /** Load the image right away, for the first post on screen (largest contentful paint). */
  eager?: boolean;
  /** Drawn over the media, e.g. the caption; over a video it sits below the player's controls. */
  overlay?: ReactNode;
  /** Positions a video's sound control, e.g. beside a Back button; see VideoPlayer. */
  soundControlClassName?: string;
  /** A video's `preload` hint while it isn't playing; see VideoPlayer. Ignored for images. */
  videoPreload?: VideoPreload;
  /** False renders a video as a lightweight placeholder with no media element (the feed's window). */
  videoMounted?: boolean;
  /** See VideoPlayer's onActiveChange. */
  onVideoActiveChange?: (active: boolean) => void;
  className?: string;
};

/**
 * A post's single media item (A-02), filling its parent, which must be
 * positioned and sized. It is centred and never cropped (object-contain,
 * FR-FEED-10). Images go through next/image (resized and lazy-loaded,
 * NFR-PERF-03; next.config.ts only allows our Storage bucket). Videos use the
 * custom VideoPlayer (FR-FEED-09, A-03): autoplay in view, muted unless the
 * viewer turned sound on, and only their metadata is fetched until they play
 * or the feed asks to buffer them ahead (`videoPreload`, NFR-PERF-03).
 */
export function PostMedia({
  post,
  sizes,
  eager = false,
  overlay,
  soundControlClassName,
  videoPreload,
  videoMounted = true,
  onVideoActiveChange,
  className,
}: PostMediaProps) {
  const t = useTranslations();
  const name = post.author.displayName;

  if (post.mediaType === "VIDEO") {
    const label = t("post.videoLabel", { name });
    if (!videoMounted)
      return <VideoPlaceholder label={label} overlay={overlay} className={className} />;
    return (
      <VideoPlayer
        src={post.mediaUrl}
        label={label}
        overlay={overlay}
        soundControlClassName={soundControlClassName}
        preload={videoPreload}
        onActiveChange={onVideoActiveChange}
        className={className}
      />
    );
  }

  return (
    <>
      <Image
        src={post.mediaUrl}
        alt={t("post.imageAlt", { name })}
        fill
        sizes={sizes}
        // Next 16 recommends loading/fetchPriority over the `preload` prop when several
        // images could be the LCP element, as in a feed.
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        className={cn("object-contain", className)}
      />
      {overlay}
    </>
  );
}
