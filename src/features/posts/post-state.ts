import type { Post } from "@/lib/api/types";

/*
 * Pure state transitions for a post, shared by optimistic updates and their
 * rollbacks. Each one is a no-op when the post is already in the target state,
 * so applying it twice (or rolling back a change that a later click already
 * reversed) never drifts the counts.
 */

/** The post as liked (`true`) or not liked (`false`), with the like count adjusted. */
export function withLiked(post: Post, liked: boolean): Post {
  if (post.likedByMe === liked) return post;
  return {
    ...post,
    likedByMe: liked,
    likeCount: Math.max(0, post.likeCount + (liked ? 1 : -1)),
  };
}

/** The post as saved (`true`) or not saved (`false`). */
export function withSaved(post: Post, saved: boolean): Post {
  if (post.savedByMe === saved) return post;
  return { ...post, savedByMe: saved };
}

/** The post with its comment count changed by `delta` (never below zero). */
export function withCommentCountChange(post: Post, delta: number): Post {
  return { ...post, commentCount: Math.max(0, post.commentCount + delta) };
}
