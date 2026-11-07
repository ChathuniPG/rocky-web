import { describe, expect, it } from "vitest";

import type { Comment } from "@/lib/api/types";

import { prependComment, removeComment, type CommentPages } from "./comment-cache";

function makeComment(id: string): Comment {
  return {
    id,
    postId: "post-1",
    body: `Comment ${id}`,
    createdAt: "2026-11-07T10:00:00.000Z",
    author: { id: "u1", username: "alice", displayName: "Alice", avatarUrl: null },
  };
}

function makePages(...pages: Comment[][]): CommentPages {
  return {
    pages: pages.map((items, index) => ({
      items,
      nextCursor: index < pages.length - 1 ? `c${index + 1}` : null,
    })),
    pageParams: pages.map((_, index) => (index === 0 ? undefined : `c${index}`)),
  };
}

describe("prependComment", () => {
  it("puts the new comment at the top of the first page", () => {
    const data = makePages([makeComment("b")], [makeComment("a")]);
    const result = prependComment(data, makeComment("c"));

    expect(result?.pages[0]?.items.map((comment) => comment.id)).toEqual(["c", "b"]);
    expect(result?.pages[1]).toBe(data.pages[1]);
    expect(result?.pageParams).toEqual(data.pageParams);
  });

  it("leaves an uncached list alone", () => {
    expect(prependComment(undefined, makeComment("c"))).toBeUndefined();
  });

  it("does not add a comment twice", () => {
    const data = makePages([makeComment("b")], [makeComment("a")]);
    expect(prependComment(data, makeComment("a"))).toBe(data);
  });
});

describe("removeComment", () => {
  it("removes the comment from whichever page holds it", () => {
    const data = makePages([makeComment("c"), makeComment("b")], [makeComment("a")]);
    const result = removeComment(data, "a");

    expect(result?.pages[0]).toBe(data.pages[0]);
    expect(result?.pages[1]?.items).toEqual([]);
  });

  it("returns the same reference when the comment isn't listed", () => {
    const data = makePages([makeComment("a")]);
    expect(removeComment(data, "missing")).toBe(data);
    expect(removeComment(undefined, "a")).toBeUndefined();
  });
});
