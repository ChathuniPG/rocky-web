import type { InfiniteData } from "@tanstack/react-query";

import type { Comment, CommentPage } from "@/lib/api/types";

/** The cached pages of a post's comments. */
export type CommentPages = InfiniteData<CommentPage, unknown>;

/**
 * Adds a new comment to the top of the first page; comments are listed newest
 * first. Returns `undefined` when the list isn't cached yet (it loads fresh
 * anyway). Skips a comment that is already listed.
 */
export function prependComment(
  data: CommentPages | undefined,
  comment: Comment,
): CommentPages | undefined {
  const [firstPage, ...otherPages] = data?.pages ?? [];
  if (!data || !firstPage) return data;
  if (data.pages.some((page) => page.items.some((item) => item.id === comment.id))) return data;

  return {
    ...data,
    pages: [{ ...firstPage, items: [comment, ...firstPage.items] }, ...otherPages],
  };
}

/** Removes a deleted comment from whichever page holds it. */
export function removeComment(
  data: CommentPages | undefined,
  commentId: string,
): CommentPages | undefined {
  if (!data) return data;

  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((item) => item.id === commentId)) return page;
    changed = true;
    return { ...page, items: page.items.filter((item) => item.id !== commentId) };
  });
  return changed ? { ...data, pages } : data;
}
