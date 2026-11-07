"use client";

import Link from "next/link";
import { useState } from "react";

import { RelativeTime } from "@/components/relative-time";
import { profileHref } from "@/features/navigation/nav-items";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { ExpandableCaption } from "./expandable-caption";

// White rings with a dark offset stay visible on any part of the media.
const overlayFocusRing =
  "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black";

type PostCaptionOverlayProps = {
  post: Pick<Post, "caption" | "createdAt" | "mediaType" | "author">;
  /** Id of the author link, which names the post's `<article>`. */
  authorLinkId: string;
};

/**
 * The author's name, the time and the caption overlaid at the bottom of the
 * media (FR-FEED-10). Contrast comes from a dark halo around the white text
 * (`media-text-halo`, design.md 7.2), which keeps it readable over any image, even
 * pure white, in both themes. So there is no dark band behind the text: only a
 * light, short gradient at the very bottom, and the media stays unobscured.
 * An expanded caption can reach far above that gradient, so while expanded the
 * same light gradient grows to cover the whole caption instead.
 * Over a video the text sits just above the player's progress bar, never on it
 * (FR-FEED-09). The overlay lets clicks through to the media (the player's
 * play/pause surface); only its link, button and expanded caption take them.
 */
export function PostCaptionOverlay({ post, authorLinkId }: PostCaptionOverlayProps) {
  const { author } = post;
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  return (
    <>
      {/* Hidden while expanded: the text block then carries the gradient, and two would stack into a dark band. */}
      {isCaptionExpanded ? null : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-black/35 to-transparent"
        />
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 flex max-h-[65%] flex-col gap-1 px-4 pb-4 text-white media-text-halo",
          // bottom-3 clears the progress bar's 12px touch strip (VideoProgressBar).
          post.mediaType === "VIDEO" ? "bottom-3" : "bottom-0",
          // Expanded: the same 35% black behind the whole caption, fading out in a text-free 2.5rem strip above it.
          isCaptionExpanded
            ? "bg-[linear-gradient(to_top,rgb(0_0_0/0.35)_calc(100%-2.5rem),transparent)] pt-10"
            : "pt-2",
        )}
      >
        <p className="flex min-w-0 items-baseline gap-1.5 text-sm">
          <Link
            id={authorLinkId}
            href={profileHref(author.username)}
            className={cn(
              "pointer-events-auto truncate rounded-sm font-semibold outline-none hover:underline",
              overlayFocusRing,
            )}
          >
            {author.displayName}
          </Link>
          <span className="truncate">@{author.username}</span>
          <span aria-hidden="true">·</span>
          {/* RelativeTime is muted grey by default, which disappears over media. */}
          <RelativeTime dateTime={post.createdAt} className="shrink-0 text-white" />
        </p>
        {post.caption ? (
          <ExpandableCaption
            text={post.caption}
            className="pointer-events-auto"
            focusRingClassName={overlayFocusRing}
            onExpandedChange={setIsCaptionExpanded}
          />
        ) : null}
      </div>
    </>
  );
}
