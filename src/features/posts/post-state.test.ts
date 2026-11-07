import { describe, expect, it } from "vitest";

import type { Post } from "@/lib/api/types";

import { withCommentCountChange, withLiked, withSaved } from "./post-state";

const post: Post = {
  id: "a",
  caption: "",
  mediaUrl: "https://firebasestorage.googleapis.com/v0/b/test/o/posts%2Fa.png",
  mediaType: "IMAGE",
  likeCount: 3,
  commentCount: 1,
  createdAt: "2026-11-07T10:00:00.000Z",
  updatedAt: "2026-11-07T10:00:00.000Z",
  author: { id: "u", username: "alice", displayName: "Alice", avatarUrl: null },
  likedByMe: false,
  savedByMe: false,
};

describe("withLiked", () => {
  it("likes and unlikes with the count adjusted", () => {
    const liked = withLiked(post, true);
    expect(liked).toMatchObject({ likedByMe: true, likeCount: 4 });
    expect(withLiked(liked, false)).toMatchObject({ likedByMe: false, likeCount: 3 });
  });

  it("is a no-op when the post is already in that state", () => {
    expect(withLiked(post, false)).toBe(post);
  });

  it("never drops the count below zero", () => {
    expect(withLiked({ ...post, likedByMe: true, likeCount: 0 }, false).likeCount).toBe(0);
  });
});

describe("withSaved", () => {
  it("toggles the saved flag and is a no-op when unchanged", () => {
    expect(withSaved(post, true).savedByMe).toBe(true);
    expect(withSaved(post, false)).toBe(post);
  });
});

describe("withCommentCountChange", () => {
  it("adds and removes comments without going negative", () => {
    expect(withCommentCountChange(post, 1).commentCount).toBe(2);
    expect(withCommentCountChange(post, -5).commentCount).toBe(0);
  });
});
