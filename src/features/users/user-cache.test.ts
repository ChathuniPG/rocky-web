import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import type { Profile, UserSearchResult } from "@/lib/api/types";

import {
  applyFollowChangeToData,
  dataContainsUser,
  markFollowingSearchesStale,
  updateFollowInCache,
  type FollowChange,
  type UserSearchPages,
} from "./user-cache";
import { userKeys } from "./user-query-keys";

const VIEWER_ID = "viewer";

function makeResult(id: string, overrides: Partial<UserSearchResult> = {}): UserSearchResult {
  return {
    id,
    username: `user_${id}`,
    displayName: `User ${id}`,
    avatarUrl: null,
    isFollowing: false,
    ...overrides,
  };
}

function makePages(...pages: UserSearchResult[][]): UserSearchPages {
  return {
    pages: pages.map((items, index) => ({
      items,
      nextCursor: index < pages.length - 1 ? `cursor-${index + 1}` : null,
    })),
    pageParams: pages.map((_, index) => (index === 0 ? undefined : `cursor-${index}`)),
  };
}

function makeProfile(id: string, overrides: Partial<Profile> = {}): Profile {
  return {
    id,
    username: `user_${id}`,
    displayName: `User ${id}`,
    bio: null,
    avatarUrl: null,
    createdAt: "2026-11-07T10:00:00.000Z",
    postCount: 0,
    followerCount: 10,
    followingCount: 5,
    isFollowing: false,
    isMe: false,
    ...overrides,
  };
}

const follow = (userId: string, overrides: Partial<FollowChange> = {}): FollowChange => ({
  userId,
  isFollowing: true,
  viewerId: VIEWER_ID,
  viewerFollowingDelta: 1,
  ...overrides,
});

describe("applyFollowChangeToData", () => {
  it("sets isFollowing on the matching search result and keeps the infinite structure", () => {
    const data = makePages([makeResult("a"), makeResult("b")], [makeResult("c")]);
    const result = applyFollowChangeToData(data, follow("c")) as UserSearchPages;

    expect(result.pageParams).toEqual(data.pageParams);
    expect(result.pages[1]?.items[0]?.isFollowing).toBe(true);
    // The untouched page keeps its reference.
    expect(result.pages[0]).toBe(data.pages[0]);
  });

  it("returns the same search data when the user isn't in it or is already in that state", () => {
    const data = makePages([makeResult("a", { isFollowing: true })]);
    expect(applyFollowChangeToData(data, follow("x"))).toBe(data);
    expect(applyFollowChangeToData(data, follow("a"))).toBe(data);
  });

  it("moves the followed user's follower count by one optimistically", () => {
    const profile = makeProfile("a");
    expect(applyFollowChangeToData(profile, follow("a"))).toMatchObject({
      isFollowing: true,
      followerCount: 11,
    });
    const followed = makeProfile("a", { isFollowing: true });
    expect(
      applyFollowChangeToData(
        followed,
        follow("a", { isFollowing: false, viewerFollowingDelta: -1 }),
      ),
    ).toMatchObject({ isFollowing: false, followerCount: 9 });
  });

  it("does not drift the follower count when the state is already applied", () => {
    const profile = makeProfile("a", { isFollowing: true, followerCount: 11 });
    expect(applyFollowChangeToData(profile, follow("a"))).toBe(profile);
  });

  it("adopts the server's follower count", () => {
    const profile = makeProfile("a", { isFollowing: true, followerCount: 11 });
    expect(
      applyFollowChangeToData(profile, follow("a", { followerCount: 42, viewerFollowingDelta: 0 })),
    ).toMatchObject({ isFollowing: true, followerCount: 42 });
  });

  it("never lets a count drop below zero", () => {
    const profile = makeProfile("a", { isFollowing: true, followerCount: 0 });
    expect(
      applyFollowChangeToData(
        profile,
        follow("a", { isFollowing: false, viewerFollowingDelta: -1 }),
      ),
    ).toMatchObject({ followerCount: 0 });
  });

  it("changes the viewer's own following count", () => {
    const own = makeProfile(VIEWER_ID, { isMe: true, followingCount: 5 });
    expect(applyFollowChangeToData(own, follow("a"))).toMatchObject({ followingCount: 6 });
    expect(applyFollowChangeToData(own, follow("a", { viewerFollowingDelta: 0 }))).toBe(own);
  });

  it("leaves other profiles and unknown shapes untouched", () => {
    const other = makeProfile("b");
    expect(applyFollowChangeToData(other, follow("a"))).toBe(other);
    const unknown = { hello: "world" };
    expect(applyFollowChangeToData(unknown, follow("a"))).toBe(unknown);
    expect(applyFollowChangeToData(undefined, follow("a"))).toBeUndefined();
  });
});

describe("dataContainsUser", () => {
  it("finds a user in search pages and profiles", () => {
    expect(dataContainsUser(makePages([makeResult("a")], [makeResult("b")]), "b")).toBe(true);
    expect(dataContainsUser(makePages([makeResult("a")]), "b")).toBe(false);
    expect(dataContainsUser(makeProfile("a"), "a")).toBe(true);
    expect(dataContainsUser(undefined, "a")).toBe(false);
  });
});

describe("updateFollowInCache", () => {
  it("updates every cached place the user appears", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(userKeys.search("us", "all"), makePages([makeResult("a")]));
    queryClient.setQueryData(userKeys.search("user", "following"), makePages([makeResult("a")]));
    queryClient.setQueryData(userKeys.profile("user_a"), makeProfile("a"));
    queryClient.setQueryData(
      userKeys.profile("me"),
      makeProfile(VIEWER_ID, { isMe: true, followingCount: 5 }),
    );

    updateFollowInCache(queryClient, follow("a"));

    const all = queryClient.getQueryData<UserSearchPages>(userKeys.search("us", "all"));
    const following = queryClient.getQueryData<UserSearchPages>(
      userKeys.search("user", "following"),
    );
    expect(all?.pages[0]?.items[0]?.isFollowing).toBe(true);
    expect(following?.pages[0]?.items[0]?.isFollowing).toBe(true);
    expect(queryClient.getQueryData<Profile>(userKeys.profile("user_a"))).toMatchObject({
      isFollowing: true,
      followerCount: 11,
    });
    expect(queryClient.getQueryData<Profile>(userKeys.profile("me"))?.followingCount).toBe(6);
  });
});

describe("markFollowingSearchesStale", () => {
  it("invalidates only the following-filter searches", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(userKeys.search("a", "all"), makePages([]));
    queryClient.setQueryData(userKeys.search("a", "following"), makePages([]));

    await markFollowingSearchesStale(queryClient);

    const cache = queryClient.getQueryCache();
    expect(cache.find({ queryKey: userKeys.search("a", "following") })?.state.isInvalidated).toBe(
      true,
    );
    expect(cache.find({ queryKey: userKeys.search("a", "all") })?.state.isInvalidated).toBe(false);
  });
});
