import type { InfiniteData, Query, QueryClient } from "@tanstack/react-query";

import type { Profile, UserSearchPage } from "@/lib/api/types";

import { userKeys } from "./user-query-keys";

/*
 * One place to change a follow everywhere it is cached (FR-PROF-05): search
 * results (both filters), the followed user's profile and the viewer's own
 * profile. Each query keeps its own copy of a user, so a follow on the search
 * page would otherwise leave the profile showing the old state and counts.
 */

/** The cached data of an infinite user search. */
export type UserSearchPages = InfiniteData<UserSearchPage, unknown>;

/** A follow or unfollow as it should appear in the cache. */
export type FollowChange = {
  /** The user being followed or unfollowed. */
  userId: string;
  isFollowing: boolean;
  /**
   * The server's follower count after the change. When omitted (optimistic
   * update or rollback), the cached count moves by one, but only if the cached
   * state actually changes.
   */
  followerCount?: number;
  /** The signed-in user, whose own profile shows the following count. */
  viewerId: string;
  /** How much the viewer's following count changes (+1, -1 or 0). */
  viewerFollowingDelta: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Whether cached data is a profile (GET /users/{username}). */
export function isProfile(value: unknown): value is Profile {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.username === "string" &&
    typeof value.followerCount === "number" &&
    typeof value.followingCount === "number" &&
    typeof value.isMe === "boolean"
  );
}

/** Whether cached data is the pages of an infinite user search. */
export function isUserSearchPages(value: unknown): value is UserSearchPages {
  return (
    isRecord(value) &&
    Array.isArray(value.pages) &&
    Array.isArray(value.pageParams) &&
    value.pages.every((page) => isRecord(page) && Array.isArray(page.items))
  );
}

function applyToProfile(profile: Profile, change: FollowChange): Profile {
  let next = profile;

  if (profile.id === change.userId) {
    const stateChanges = profile.isFollowing !== change.isFollowing;
    const followerCount =
      change.followerCount ??
      (stateChanges
        ? Math.max(0, profile.followerCount + (change.isFollowing ? 1 : -1))
        : profile.followerCount);
    if (stateChanges || followerCount !== profile.followerCount) {
      next = { ...next, isFollowing: change.isFollowing, followerCount };
    }
  }

  if (profile.id === change.viewerId && change.viewerFollowingDelta !== 0) {
    next = {
      ...next,
      followingCount: Math.max(0, profile.followingCount + change.viewerFollowingDelta),
    };
  }

  return next;
}

function applyToSearchPages(data: UserSearchPages, change: FollowChange): UserSearchPages {
  let changed = false;
  const pages = data.pages.map((page) => {
    const match = page.items.some(
      (user) => user.id === change.userId && user.isFollowing !== change.isFollowing,
    );
    if (!match) return page;
    changed = true;
    return {
      ...page,
      items: page.items.map((user) =>
        user.id === change.userId ? { ...user, isFollowing: change.isFollowing } : user,
      ),
    };
  });
  return changed ? { ...data, pages } : data;
}

/**
 * Applies a follow change to any cached data shape. Returns the same reference
 * when nothing changes, so unrelated queries don't re-render. Unknown shapes
 * are returned untouched.
 */
export function applyFollowChangeToData(data: unknown, change: FollowChange): unknown {
  if (isProfile(data)) return applyToProfile(data, change);
  if (isUserSearchPages(data)) return applyToSearchPages(data, change);
  return data;
}

/** Whether cached data holds the user with `userId` (as a profile or a search result). */
export function dataContainsUser(data: unknown, userId: string): boolean {
  if (isProfile(data)) return data.id === userId;
  if (isUserSearchPages(data)) {
    return data.pages.some((page) => page.items.some((user) => user.id === userId));
  }
  return false;
}

/** Updates every cached copy of a follow (FR-PROF-05, FR-SRCH-03). */
export function updateFollowInCache(queryClient: QueryClient, change: FollowChange): void {
  queryClient.setQueriesData<unknown>({ queryKey: userKeys.all }, (data: unknown) =>
    applyFollowChangeToData(data, change),
  );
}

/**
 * Cancels in-flight fetches of queries that hold either user, so a response
 * that started before an optimistic update can't overwrite it. Queries without
 * those users (e.g. a search still loading its first page) keep fetching.
 */
export function cancelFollowQueries(
  queryClient: QueryClient,
  userIds: readonly string[],
): Promise<void> {
  return queryClient.cancelQueries({
    queryKey: userKeys.all,
    predicate: (query: Query) => userIds.some((id) => dataContainsUser(query.state.data, id)),
  });
}

/**
 * Marks "People I follow" searches as stale without refetching them now
 * (FR-SRCH-03). A row someone just unfollowed stays in place, so the click can
 * be undone, and the list is accurate the next time it loads.
 */
export function markFollowingSearchesStale(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: userKeys.searches(),
    predicate: (query: Query) => query.queryKey[3] === "following",
    refetchType: "none",
  });
}

/** The parts of a user that an Edit Profile changes (FR-PROF-04). */
export type EditableUserFields = Pick<Profile, "id" | "displayName" | "bio" | "avatarUrl">;

/**
 * Applies an edited user's display name, bio and avatar to any cached data
 * shape: their profile and their rows in search results. Same reference when
 * nothing changes; unknown shapes are returned untouched.
 */
export function applyUserEditToData(data: unknown, user: EditableUserFields): unknown {
  if (isProfile(data)) {
    if (data.id !== user.id) return data;
    return { ...data, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl };
  }
  if (!isUserSearchPages(data)) return data;

  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((item) => item.id === user.id)) return page;
    changed = true;
    return {
      ...page,
      items: page.items.map((item) =>
        item.id === user.id
          ? { ...item, displayName: user.displayName, avatarUrl: user.avatarUrl }
          : item,
      ),
    };
  });
  return changed ? { ...data, pages } : data;
}

/** Updates every cached copy of a user after they edit their profile (FR-PROF-04). */
export function updateUserInCache(queryClient: QueryClient, user: EditableUserFields): void {
  queryClient.setQueriesData<unknown>({ queryKey: userKeys.all }, (data: unknown) =>
    applyUserEditToData(data, user),
  );
}
