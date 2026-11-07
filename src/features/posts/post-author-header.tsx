"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { RelativeTime } from "@/components/relative-time";
import { UserAvatar } from "@/components/user-avatar";
import { profileHref } from "@/features/navigation/nav-items";
import type { Post } from "@/lib/api/types";

type PostAuthorHeaderProps = {
  post: Pick<Post, "createdAt" | "author">;
  /** Id of the author link, which names the surrounding content. */
  authorLinkId: string;
  /** Extra controls on the right, e.g. the owner's edit/delete menu. */
  actions?: ReactNode;
};

/** A post's author row: avatar, display name, @username and time (FR-FEED-02). */
export function PostAuthorHeader({ post, authorLinkId, actions }: PostAuthorHeaderProps) {
  const { author } = post;
  const authorHref = profileHref(author.username);

  return (
    <header className="flex items-center gap-3">
      {/* The name link next to it leads to the same profile, so the avatar is skipped by keyboard and screen readers. */}
      <Link href={authorHref} tabIndex={-1} aria-hidden="true" className="shrink-0 rounded-full">
        <UserAvatar name={author.displayName} src={author.avatarUrl} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          id={authorLinkId}
          href={authorHref}
          className="block truncate rounded-sm font-semibold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        >
          {author.displayName}
        </Link>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">@{author.username}</span>
          <span aria-hidden="true">·</span>
          <RelativeTime dateTime={post.createdAt} className="shrink-0" />
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
