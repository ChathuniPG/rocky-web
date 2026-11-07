"use client";

import Link from "next/link";

import { UserAvatar } from "@/components/user-avatar";
import { profileHref } from "@/features/navigation/nav-items";
import { FollowButton } from "@/features/users/follow-button";
import type { UserSearchResult } from "@/lib/api/types";

/**
 * One search result (FR-SRCH-01, FR-SRCH-04): avatar, display name and
 * @username as one link to the profile, with the Follow toggle beside it. The
 * button is a sibling of the link, not inside it, because interactive elements
 * can't be nested. The API never returns the viewer, so every row can be followed.
 */
export function UserSearchResultRow({ user }: { user: UserSearchResult }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Link
        href={profileHref(user.username)}
        className="-mx-2 flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring active:bg-[color-mix(in_oklab,var(--accent),var(--foreground)_6%)]"
      >
        {/* The display name already names the link; the avatar's alt text would repeat it. */}
        <span aria-hidden="true" className="shrink-0">
          <UserAvatar name={user.displayName} src={user.avatarUrl} />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold">{user.displayName}</span>
          <span className="truncate text-sm text-muted-foreground">@{user.username}</span>
        </span>
      </Link>
      <FollowButton user={user} className="shrink-0" />
    </div>
  );
}
