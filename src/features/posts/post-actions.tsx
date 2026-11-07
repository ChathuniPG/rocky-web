"use client";

import { BookmarkIcon, HeartIcon, MessageCircleIcon, Share2Icon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/i18n/i18n-provider";
import type { Post } from "@/lib/api/types";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { postHref } from "./share-post";
import { useSharePost, useToggleLike, useToggleSave } from "./use-post-actions";

type PostActionsProps = {
  post: Post;
  /** Whether the comment button links to the post page (off on that page itself). */
  linkComments: boolean;
};

/** Like, comment, share and save controls with their counts (FR-FEED-02 to FR-FEED-05). */
export function PostActions({ post, linkComments }: PostActionsProps) {
  const t = useTranslations();
  const locale = useLocale();
  const like = useToggleLike(post.id);
  const save = useToggleSave(post.id);
  const share = useSharePost();

  const likeCount = formatCount(post.likeCount, locale);
  const commentCount = formatCount(post.commentCount, locale);

  const commentContent = (
    <>
      <MessageCircleIcon aria-hidden="true" />
      <span aria-hidden="true">{commentCount}</span>
      <span className="sr-only">{t("post.actions.comments", { count: post.commentCount })}</span>
    </>
  );

  return (
    <div className="-mx-2 flex items-center gap-1">
      {/* aria-pressed exposes the like as a toggle; the count stays in the accessible name. */}
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={post.likedByMe}
        onClick={() => like.mutate(!post.likedByMe)}
        className={cn("tabular-nums", post.likedByMe && "text-highlight-text")}
      >
        <HeartIcon aria-hidden="true" className={cn(post.likedByMe && "fill-highlight")} />
        <span aria-hidden="true">{likeCount}</span>
        <span className="sr-only">{t("post.actions.like", { count: post.likeCount })}</span>
      </Button>

      {linkComments ? (
        <Button asChild variant="ghost" size="sm" className="tabular-nums">
          <Link href={postHref(post.id)}>{commentContent}</Link>
        </Button>
      ) : (
        // On the post page the comments are right below; the count is informational.
        <span className="inline-flex h-8 items-center gap-1.5 px-3 text-[0.8rem] font-medium tabular-nums [&_svg]:size-3.5">
          {commentContent}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("post.actions.share")}
        onClick={() => void share(post)}
      >
        <Share2Icon aria-hidden="true" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("post.actions.save")}
        aria-pressed={post.savedByMe}
        onClick={() => save.mutate(!post.savedByMe)}
        className={cn("ml-auto", post.savedByMe && "text-primary")}
      >
        <BookmarkIcon aria-hidden="true" className={cn(post.savedByMe && "fill-current")} />
      </Button>
    </div>
  );
}
