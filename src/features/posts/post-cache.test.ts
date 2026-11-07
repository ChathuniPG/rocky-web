import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import type { Post } from "@/lib/api/types";

import {
  findPostInCache,
  mapAuthorInData,
  mapPostInData,
  removePostFromCache,
  removePostFromData,
  updatePostInCache,
  type PostPages,
} from "./post-cache";
import { postKeys } from "./post-query-keys";

function makePost(id: string, overrides: Partial<Post> = {}): Post {
  return {
    id,
    caption: `Caption ${id}`,
    mediaUrl: `https://firebasestorage.googleapis.com/v0/b/test/o/posts%2F${id}.png`,
    mediaType: "IMAGE",
    likeCount: 0,
    commentCount: 0,
    createdAt: "2026-11-07T10:00:00.000Z",
    updatedAt: "2026-11-07T10:00:00.000Z",
    author: { id: "author-1", username: "alice", displayName: "Alice", avatarUrl: null },
    likedByMe: false,
    savedByMe: false,
    ...overrides,
  };
}

function makePages(...pages: Post[][]): PostPages {
  return {
    pages: pages.map((items, index) => ({
      items,
      nextCursor: index < pages.length - 1 ? `cursor-${index + 1}` : null,
    })),
    pageParams: pages.map((_, index) => (index === 0 ? undefined : `cursor-${index}`)),
  };
}

const like = (post: Post): Post => ({ ...post, likedByMe: true, likeCount: post.likeCount + 1 });

describe("mapPostInData", () => {
  it("updates a matching single post", () => {
    const result = mapPostInData(makePost("a"), "a", like);
    expect(result).toMatchObject({ id: "a", likedByMe: true, likeCount: 1 });
  });

  it("returns the same reference for a single post with another id", () => {
    const post = makePost("a");
    expect(mapPostInData(post, "b", like)).toBe(post);
  });

  it("updates the post on whichever page holds it and keeps the infinite structure", () => {
    const data = makePages([makePost("a"), makePost("b")], [makePost("c")]);
    const result = mapPostInData(data, "c", like) as PostPages;

    expect(result.pageParams).toEqual(data.pageParams);
    expect(result.pages.map((page) => page.nextCursor)).toEqual(["cursor-1", null]);
    expect(result.pages[1]?.items[0]).toMatchObject({ id: "c", likedByMe: true, likeCount: 1 });
  });

  it("leaves other posts and untouched pages as the same references", () => {
    const data = makePages([makePost("a"), makePost("b")], [makePost("c")]);
    const result = mapPostInData(data, "a", like) as PostPages;

    expect(result.pages[0]?.items[1]).toBe(data.pages[0]?.items[1]);
    expect(result.pages[1]).toBe(data.pages[1]);
  });

  it("returns the same reference when no page holds the post", () => {
    const data = makePages([makePost("a")]);
    expect(mapPostInData(data, "missing", like)).toBe(data);
  });

  it("passes unknown shapes through untouched", () => {
    const comments = { pages: [{ items: "not a list" }], pageParams: [undefined] };
    expect(mapPostInData(comments, "a", like)).toBe(comments);
    expect(mapPostInData(undefined, "a", like)).toBeUndefined();
    expect(mapPostInData({ unrelated: true }, "a", like)).toEqual({ unrelated: true });
  });
});

describe("removePostFromData", () => {
  it("removes the post from its page only", () => {
    const data = makePages([makePost("a"), makePost("b")], [makePost("c")]);
    const result = removePostFromData(data, "b") as PostPages;

    expect(result.pages[0]?.items.map((post) => post.id)).toEqual(["a"]);
    expect(result.pages[1]).toBe(data.pages[1]);
    expect(result.pageParams).toEqual(data.pageParams);
  });

  it("returns the same reference when the post isn't listed", () => {
    const data = makePages([makePost("a")]);
    expect(removePostFromData(data, "missing")).toBe(data);
  });

  it("leaves a single post alone", () => {
    const post = makePost("a");
    expect(removePostFromData(post, "a")).toBe(post);
  });
});

describe("cache helpers on a QueryClient", () => {
  function seededClient(): QueryClient {
    const queryClient = new QueryClient();
    queryClient.setQueryData(postKeys.feed(), makePages([makePost("a"), makePost("b")]));
    queryClient.setQueryData(postKeys.byUser("alice"), makePages([makePost("a")]));
    queryClient.setQueryData(postKeys.saved(), makePages([makePost("b")]));
    queryClient.setQueryData(postKeys.detail("a"), makePost("a"));
    return queryClient;
  }

  it("updates every cached copy of a post", () => {
    const queryClient = seededClient();
    updatePostInCache(queryClient, "a", like);

    const feed = queryClient.getQueryData<PostPages>(postKeys.feed());
    const profile = queryClient.getQueryData<PostPages>(postKeys.byUser("alice"));
    expect(feed?.pages[0]?.items[0]?.likeCount).toBe(1);
    expect(feed?.pages[0]?.items[1]?.likeCount).toBe(0);
    expect(profile?.pages[0]?.items[0]?.likeCount).toBe(1);
    expect(queryClient.getQueryData<Post>(postKeys.detail("a"))?.likeCount).toBe(1);
  });

  it("does not touch comment queries", () => {
    const queryClient = seededClient();
    const comments = { pages: [{ items: [{ id: "a" }], nextCursor: null }], pageParams: [null] };
    queryClient.setQueryData(postKeys.comments("a"), comments);

    updatePostInCache(queryClient, "a", like);
    expect(queryClient.getQueryData(postKeys.comments("a"))).toBe(comments);
  });

  it("removes a post from every list and drops its detail query", () => {
    const queryClient = seededClient();
    removePostFromCache(queryClient, "a");

    const feed = queryClient.getQueryData<PostPages>(postKeys.feed());
    expect(feed?.pages[0]?.items.map((post) => post.id)).toEqual(["b"]);
    expect(queryClient.getQueryData<PostPages>(postKeys.byUser("alice"))?.pages[0]?.items).toEqual(
      [],
    );
    expect(queryClient.getQueryData(postKeys.detail("a"))).toBeUndefined();
  });

  it("finds a cached copy of a post", () => {
    const queryClient = seededClient();
    expect(findPostInCache(queryClient, "b")?.id).toBe("b");
    expect(findPostInCache(queryClient, "missing")).toBeUndefined();
  });
});

describe("mapAuthorInData", () => {
  const author = {
    id: "author-1",
    username: "alice",
    displayName: "Alice B",
    avatarUrl: "https://x/a.png",
  };

  it("updates every post by the author and keeps others", () => {
    const other = makePost("b", {
      author: { id: "author-2", username: "bob", displayName: "Bob", avatarUrl: null },
    });
    const data = makePages([makePost("a"), other], [makePost("c")]);
    const result = mapAuthorInData(data, author) as PostPages;

    expect(result.pages[0]?.items[0]?.author).toEqual(author);
    expect(result.pages[0]?.items[1]).toBe(other);
    expect(result.pages[1]?.items[0]?.author.displayName).toBe("Alice B");
  });

  it("updates a single post by the author", () => {
    expect(mapAuthorInData(makePost("a"), author)).toMatchObject({ author });
  });

  it("returns the same reference when the author has no post there", () => {
    const data = makePages([makePost("a")]);
    expect(mapAuthorInData(data, { ...author, id: "author-9" })).toBe(data);
  });
});
