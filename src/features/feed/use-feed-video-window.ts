"use client";

import { useState, type FocusEvent, type RefObject } from "react";

import { useLookAheadAllowed } from "@/features/media/use-look-ahead-allowed";
import {
  feedVideoPreload,
  isInVideoWindow,
  lookAheadVideoIndex,
  type VideoPreload,
} from "@/features/media/video-preload";
import type { MediaType } from "@/lib/api/types";

import { useVisiblePostIndex } from "./use-visible-post-index";

/** What one feed post needs to know about its video. */
export type FeedVideoProps = {
  videoPreload: VideoPreload;
  videoMounted: boolean;
  onVideoActiveChange: (active: boolean) => void;
};

/** Focus handlers for a feed item, so the post holding focus keeps its player. */
export type FeedItemFocusProps = {
  onFocus: () => void;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
};

/**
 * Decides, for every post in the Home feed, whether its video is a real
 * player or a placeholder, and which one video is buffered ahead
 * (NFR-PERF-03). Tracks the post on screen, the video allowed to play and the
 * post holding keyboard focus; see isInVideoWindow and lookAheadVideoIndex.
 *
 * `listRef` is the list whose children are the posts; `items` is the data it
 * is rendered from (see useVisiblePostIndex).
 */
export function useFeedVideoWindow(
  mediaTypes: readonly MediaType[],
  listRef: RefObject<HTMLElement | null>,
  items: unknown,
): {
  /** The post on screen; null until one has been seen. */
  visibleIndex: number | null;
  videoPropsFor: (index: number) => FeedVideoProps;
  focusPropsFor: (index: number) => FeedItemFocusProps;
} {
  const visibleIndex = useVisiblePostIndex(listRef, items);
  const lookAheadAllowed = useLookAheadAllowed();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const lookAheadIndex = lookAheadVideoIndex(mediaTypes, visibleIndex, lookAheadAllowed);
  const anchors = { visibleIndex, lookAheadIndex, activeIndex, focusedIndex };

  // Clears an index only if it still points at this post, so a later post's update isn't undone.
  const clearIf = (index: number) => (current: number | null) =>
    current === index ? null : current;

  return {
    visibleIndex,
    videoPropsFor: (index) => ({
      videoPreload: feedVideoPreload(index, lookAheadIndex),
      videoMounted: isInVideoWindow(index, anchors),
      onVideoActiveChange: (active) => setActiveIndex(active ? index : clearIf(index)),
    }),
    focusPropsFor: (index) => ({
      onFocus: () => setFocusedIndex(index),
      onBlur: (event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setFocusedIndex(clearIf(index));
      },
    }),
  };
}
