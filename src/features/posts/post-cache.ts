import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import type { Post, PostAuthor, PostPage } from "@/lib/api/types";

import { postKeys } from "./post-query-keys";

/*
 * One place to change a post everywhere it is cached: feed pages, the post page,
 * profile lists and the saved list (all under the ["posts"] prefix). Each query
 * keeps its own copy of a post, so a like on the feed would otherwise leave
 * the post page showing the old count.
 */

/** The cached data of an infinite query over posts. */
export type PostPages = InfiniteData<PostPage, unknown>;

/** Turns a post into its updated version. Must not mutate its argument. */
export type PostUpdater = (post: Post) => Post;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Whether cached data is a single post (the post page's query). */
export function isPost(value: unknown): value is Post {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.mediaUrl === "string" &&
    typeof value.likeCount === "number" &&
    isRecord(value.author)
  );
}

/** Whether cached data is the pages of an infinite post list. */
export function isPostPages(value: unknown): value is PostPages {
  return (
    isRecord(value) &&
    Array.isArray(value.pages) &&
    Array.isArray(value.pageParams) &&
    value.pages.every((page) => isRecord(page) && Array.isArray(page.items))
  );
}

/**
 * Applies `updater` to the post with `postId` inside any cached data shape.
 * Returns the same reference when the post isn't there, so unrelated queries
 * don't re-render. Unknown shapes are returned untouched.
 */
export function mapPostInData(data: unknown, postId: string, updater: PostUpdater): unknown {
  if (isPost(data)) return data.id === postId ? updater(data) : data;
  if (!isPostPages(data)) return data;

  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((post) => post.id === postId)) return page;
    changed = true;
    return {
      ...page,
      items: page.items.map((post) => (post.id === postId ? updater(post) : post)),
    };
  });
  return changed ? { ...data, pages } : data;
}

/**
 * Removes the post with `postId` from the pages of an infinite list. A single
 * post can't be "removed" from inside its own query; callers drop that query
 * instead (see {@link removePostFromCache}).
 */
export function removePostFromData(data: unknown, postId: string): unknown {
  if (!isPostPages(data)) return data;

  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((post) => post.id === postId)) return page;
    changed = true;
    return { ...page, items: page.items.filter((post) => post.id !== postId) };
  });
  return changed ? { ...data, pages } : data;
}

/** Updates every cached copy of a post (FR-FEED-03, FR-FEED-04, FR-POST-04). */
export function updatePostInCache(
  queryClient: QueryClient,
  postId: string,
  updater: PostUpdater,
): void {
  queryClient.setQueriesData<unknown>({ queryKey: postKeys.all }, (data: unknown) =>
    mapPostInData(data, postId, updater),
  );
}

/** Removes a deleted post from every cached list and drops its own query (FR-POST-05). */
export function removePostFromCache(queryClient: QueryClient, postId: string): void {
  queryClient.removeQueries({ queryKey: postKeys.detail(postId), exact: true });
  queryClient.setQueriesData<unknown>({ queryKey: postKeys.all }, (data: unknown) =>
    removePostFromData(data, postId),
  );
}

/** Finds any cached copy of a post, e.g. to show it instantly when its page opens. */
export function findPostInCache(queryClient: QueryClient, postId: string): Post | undefined {
  for (const [, data] of queryClient.getQueriesData<unknown>({ queryKey: postKeys.all })) {
    if (isPost(data) && data.id === postId) return data;
    if (isPostPages(data)) {
      for (const page of data.pages) {
        const match = page.items.find((post) => post.id === postId);
        if (match) return match;
      }
    }
  }
  return undefined;
}

/**
 * Applies `author` to every post by that author inside any cached data shape,
 * e.g. after they change their name or avatar (FR-PROF-04). Same reference
 * when no post by them is there.
 */
export function mapAuthorInData(data: unknown, author: PostAuthor): unknown {
  const withAuthor = (post: Post): Post => ({ ...post, author: { ...post.author, ...author } });
  if (isPost(data)) return data.author.id === author.id ? withAuthor(data) : data;
  if (!isPostPages(data)) return data;

  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((post) => post.author.id === author.id)) return page;
    changed = true;
    return {
      ...page,
      items: page.items.map((post) => (post.author.id === author.id ? withAuthor(post) : post)),
    };
  });
  return changed ? { ...data, pages } : data;
}

/** Updates the author on every cached post by them: feed, post pages, grids. */
export function updateAuthorInCache(queryClient: QueryClient, author: PostAuthor): void {
  queryClient.setQueriesData<unknown>({ queryKey: postKeys.all }, (data: unknown) =>
    mapAuthorInData(data, author),
  );
}
