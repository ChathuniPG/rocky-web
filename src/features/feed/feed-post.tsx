"use client";

import { PostActions } from "@/features/posts/post-actions";
import { PostCaptionOverlay } from "@/features/posts/post-caption-overlay";
import { FEED_MEDIA_SIZES, PostMedia } from "@/features/posts/post-media";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { feedMediaFrameClasses, feedPostLayoutClasses } from "./feed-layout";

type FeedPostProps = {
  post: Post;
  /** Load the media right away; set for the first post on screen. */
  eagerMedia?: boolean;
  className?: string;
};

/**
 * One post in the TikTok-style Home feed (FR-FEED-10): the media centred in a
 * 9:16 frame sized to the screen, the author and caption overlaid on it, and
 * the actions beside it (a column from 768px, a row below that).
 */
export function FeedPost({ post, eagerMedia = false, className }: FeedPostProps) {
  const authorLinkId = `post-${post.id}-author`;

  return (
    <article aria-labelledby={authorLinkId} className={cn(feedPostLayoutClasses, className)}>
      <div className={cn(feedMediaFrameClasses, "bg-black")}>
        <PostMedia post={post} sizes={FEED_MEDIA_SIZES} eager={eagerMedia} />
        <PostCaptionOverlay post={post} authorLinkId={authorLinkId} />
      </div>
      <PostActions post={post} variant="feed" linkComments className="md:pb-2" />
    </article>
  );
}
