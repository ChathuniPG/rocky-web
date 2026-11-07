"use client";

import Link from "next/link";

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
 * media (FR-FEED-10). They sit on a dark gradient scrim with white text, so
 * contrast meets WCAG AA in both themes whatever the media looks like: a
 * text-free band fades the media in, and the text itself always sits on at
 * least 60% black (white on that is 5.7:1 even over a white pixel), however
 * far an expanded caption grows. Over a video the overlay
 * sits above the native control bar, and the scrim lets clicks through to the
 * media; only its link and button take clicks.
 */
export function PostCaptionOverlay({ post, authorLinkId }: PostCaptionOverlayProps) {
  const { author } = post;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 flex max-h-[65%] flex-col text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]",
        post.mediaType === "VIDEO" ? "bottom-12" : "bottom-0",
      )}
    >
      <div
        aria-hidden="true"
        className="h-12 shrink-0 bg-linear-to-t from-black/60 to-transparent"
      />
      <div className="flex min-h-0 flex-col gap-1 bg-linear-to-t from-black/85 to-black/60 px-4 pt-1 pb-4">
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
          <span className="truncate text-white/90">@{author.username}</span>
          <span aria-hidden="true" className="text-white/90">
            ·
          </span>
          <RelativeTime dateTime={post.createdAt} className="shrink-0 text-white/90" />
        </p>
        {post.caption ? (
          <ExpandableCaption
            text={post.caption}
            className="pointer-events-auto"
            toggleClassName={overlayFocusRing}
          />
        ) : null}
      </div>
    </div>
  );
}
