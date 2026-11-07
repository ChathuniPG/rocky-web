"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { RelativeTime } from "@/components/relative-time";
import { UserAvatar } from "@/components/user-avatar";
import { profileHref } from "@/features/navigation/nav-items";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";

import { PostActions } from "./post-actions";
import { PostMedia } from "./post-media";

type PostCardProps = {
  post: Post;
  /** Extra controls in the header, e.g. the owner's edit/delete menu on the post page. */
  headerActions?: ReactNode;
  /** Load the media right away; set for the first post on screen. */
  eagerMedia?: boolean;
  /** Link the comment button to the post page. Off on the post page itself. */
  linkComments?: boolean;
  className?: string;
};

/**
 * One post as shown in the feed and on its own page (FR-FEED-02): author,
 * media, caption, counts and actions. A client component because its actions
 * use hooks and handle clicks.
 */
export function PostCard({
  post,
  headerActions,
  eagerMedia = false,
  linkComments = true,
  className,
}: PostCardProps) {
  const { author } = post;
  const authorHref = profileHref(author.username);

  return (
    <article
      aria-labelledby={`post-${post.id}-author`}
      className={cn("space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}
    >
      <header className="flex items-center gap-3">
        <Link href={authorHref} tabIndex={-1} aria-hidden="true" className="shrink-0 rounded-full">
          <UserAvatar name={author.displayName} src={author.avatarUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            id={`post-${post.id}-author`}
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
        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </header>

      <PostMedia post={post} eager={eagerMedia} />

      <PostActions post={post} linkComments={linkComments} />

      {post.caption ? (
        // Plain text only: React escapes it, and line breaks the author typed are kept.
        <p className="text-sm break-words whitespace-pre-line">{post.caption}</p>
      ) : null}
    </article>
  );
}
