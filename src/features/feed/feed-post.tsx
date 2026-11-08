"use client";

import { PostActions } from "@/features/posts/post-actions";
import { PostCaptionOverlay } from "@/features/posts/post-caption-overlay";
import type { VideoPreload } from "@/features/media/video-preload";
import { FEED_MEDIA_SIZES, PostMedia } from "@/features/posts/post-media";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { feedMediaFrameClasses, feedPostLayoutClasses } from "./feed-layout";

type FeedPostProps = {
  post: Post;
  /** Load the media right away; set for the first post on screen. */
  eagerMedia?: boolean;
  /** A video's `preload` hint; "auto" for the next video in the feed (NFR-PERF-03). */
  videoPreload?: VideoPreload;
  /** False shows a video as a placeholder; the feed mounts only videos near the screen (NFR-PERF-03). */
  videoMounted?: boolean;
  /** Told when this post's video starts or stops being the one allowed to play. */
  onVideoActiveChange?: (active: boolean) => void;
  className?: string;
};

/**
 * One post in the TikTok-style Home feed (FR-FEED-10): the media centred in a
 * 9:16 frame sized to the screen, the author and caption overlaid on it, and
 * the actions beside it (a column from 768px, a row below that).
 */
export function FeedPost({
  post,
  eagerMedia = false,
  videoPreload,
  videoMounted,
  onVideoActiveChange,
  className,
}: FeedPostProps) {
  const authorLinkId = `post-${post.id}-author`;

  return (
    <article aria-labelledby={authorLinkId} className={cn(feedPostLayoutClasses, className)}>
      <div className={cn(feedMediaFrameClasses, "bg-black")}>
        <PostMedia
          post={post}
          sizes={FEED_MEDIA_SIZES}
          eager={eagerMedia}
          videoPreload={videoPreload}
          videoMounted={videoMounted}
          onVideoActiveChange={onVideoActiveChange}
          overlay={<PostCaptionOverlay post={post} authorLinkId={authorLinkId} />}
        />
      </div>
      <PostActions post={post} variant="feed" linkComments className="md:pb-2" />
    </article>
  );
}
