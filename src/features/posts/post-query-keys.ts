/*
 * TanStack Query keys for post data. Every query that holds posts lives under
 * ["posts"], so one cache update (post-cache.ts) reaches every copy of a post.
 * Comments are kept outside that prefix: their pages are not posts.
 */

/** Query keys for posts and comments. */
export const postKeys = {
  /** Prefix of every query whose data is a post or pages of posts. */
  all: ["posts"] as const,
  /** The home feed (GET /posts/feed), an infinite query. */
  feed: () => ["posts", "feed"] as const,
  /** One post (GET /posts/{id}). */
  detail: (postId: string) => ["posts", "detail", postId] as const,
  /** A user's posts on their profile (GET /users/{username}/posts), an infinite query. */
  byUser: (username: string) => ["posts", "user", username] as const,
  /** The signed-in user's saved posts (GET /users/me/saved), an infinite query. */
  saved: () => ["posts", "saved"] as const,
  /** A post's comments (GET /posts/{id}/comments), an infinite query. */
  comments: (postId: string) => ["comments", postId] as const,
};
