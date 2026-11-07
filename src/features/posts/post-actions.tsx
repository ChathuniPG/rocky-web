"use client";

import {
  BookmarkIcon,
  HeartIcon,
  MessageCircleIcon,
  Share2Icon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { profileHref } from "@/features/navigation/nav-items";
import { useLocale, useTranslations } from "@/i18n/i18n-provider";
import type { Post } from "@/lib/api/types";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { postHref } from "./share-post";
import { useSharePost, useToggleLike, useToggleSave } from "./use-post-actions";

type PostActionsProps = {
  post: Post;
  /**
   * `feed`: the author's avatar, then like, comment, save and share, each with a
   * caption below; a vertical column from 768px and a row below that
   * (FR-FEED-10). `inline`: a compact row, as on the post page.
   */
  variant: "feed" | "inline";
  /** Whether the comment button links to the post page (off on that page itself). */
  linkComments: boolean;
  className?: string;
};

/** Like, comment, save and share controls with their counts (FR-FEED-02 to FR-FEED-05). */
export function PostActions({ post, variant, linkComments, className }: PostActionsProps) {
  return variant === "feed" ? (
    <FeedActions post={post} linkComments={linkComments} className={className} />
  ) : (
    <InlineActions post={post} linkComments={linkComments} className={className} />
  );
}

type VariantProps = Omit<PostActionsProps, "variant">;

/** Shared state and labels for both layouts, so they behave the same. */
function usePostActionModel(post: Post) {
  const t = useTranslations();
  const locale = useLocale();
  const like = useToggleLike(post.id);
  const save = useToggleSave(post.id);
  const share = useSharePost();

  return {
    likeCount: formatCount(post.likeCount, locale),
    commentCount: formatCount(post.commentCount, locale),
    likeLabel: t("post.actions.like", { count: post.likeCount }),
    commentLabel: t("post.actions.comments", { count: post.commentCount }),
    saveLabel: t("post.actions.save"),
    shareLabel: t("post.actions.share"),
    toggleLike: () => like.mutate(!post.likedByMe),
    toggleSave: () => save.mutate(!post.savedByMe),
    sharePost: () => void share(post),
  };
}

function FeedActions({ post, linkComments, className }: VariantProps) {
  const t = useTranslations();
  const model = usePostActionModel(post);
  const { author } = post;

  return (
    <div
      className={cn(
        "flex items-start justify-center gap-2 sm:gap-4 md:flex-col md:items-center md:gap-3",
        className,
      )}
    >
      <Link
        href={profileHref(author.username)}
        aria-label={t("post.authorProfile", { name: author.displayName })}
        className="mb-1 rounded-full transition-opacity outline-none hover:opacity-85 focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:opacity-75"
      >
        <UserAvatar name={author.displayName} src={author.avatarUrl} className="size-11" />
      </Link>

      {/* aria-pressed exposes like and save as toggles; each name contains its visible caption. */}
      <StackedAction
        icon={HeartIcon}
        caption={model.likeCount}
        label={model.likeLabel}
        aria-pressed={post.likedByMe}
        onClick={model.toggleLike}
        className={cn(post.likedByMe && "text-highlight-text")}
        iconClassName={cn(post.likedByMe && "fill-highlight text-highlight")}
      />

      {linkComments ? (
        <StackedActionLink
          href={postHref(post.id)}
          icon={MessageCircleIcon}
          caption={model.commentCount}
          label={model.commentLabel}
        />
      ) : (
        <StackedInfo
          icon={MessageCircleIcon}
          caption={model.commentCount}
          label={model.commentLabel}
        />
      )}

      <StackedAction
        icon={BookmarkIcon}
        caption={t("post.actions.saveLabel")}
        label={model.saveLabel}
        aria-pressed={post.savedByMe}
        onClick={model.toggleSave}
        className={cn(post.savedByMe && "text-primary")}
        iconClassName={cn(post.savedByMe && "fill-current")}
      />

      <StackedAction
        icon={Share2Icon}
        caption={t("post.actions.shareLabel")}
        label={model.shareLabel}
        onClick={model.sharePost}
      />
    </div>
  );
}

// Round icon with a caption under it, at least 56px wide so captions in longer
// languages still fit and the touch target stays large. Button wraps its
// children in a row-direction span, so that span is stacked too.
const stackedClasses =
  "h-auto min-w-14 flex-col gap-1 rounded-xl px-1 py-1 text-xs font-semibold tabular-nums whitespace-normal [&>span:first-child]:flex-col [&_svg:not([class*='size-'])]:size-5";
const iconCircleClasses =
  "flex size-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover/button:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_10%)]";

type StackedContentProps = {
  icon: LucideIcon;
  /** Shown under the icon; hidden from screen readers, which get `label`. */
  caption: string;
  /** Full accessible name, e.g. "Like. Likes: 12". */
  label: string;
  iconClassName?: string;
};

function StackedContent({ icon: Icon, caption, label, iconClassName }: StackedContentProps) {
  return (
    <>
      <span className={iconCircleClasses}>
        <Icon aria-hidden="true" className={iconClassName} />
      </span>
      <span aria-hidden="true" className="max-w-16 truncate">
        {caption}
      </span>
      <span className="sr-only">{label}</span>
    </>
  );
}

function StackedAction({
  icon,
  caption,
  label,
  iconClassName,
  className,
  ...buttonProps
}: StackedContentProps & Omit<ComponentProps<typeof Button>, "children">) {
  return (
    <Button variant="ghost" className={cn(stackedClasses, className)} {...buttonProps}>
      <StackedContent icon={icon} caption={caption} label={label} iconClassName={iconClassName} />
    </Button>
  );
}

function StackedActionLink({ href, ...content }: StackedContentProps & { href: string }) {
  return (
    <Button asChild variant="ghost" className={stackedClasses}>
      <Link href={href}>
        <StackedContent {...content} />
      </Link>
    </Button>
  );
}

function StackedInfo(content: StackedContentProps) {
  return (
    <span className={cn("inline-flex flex-col items-center", stackedClasses)}>
      <StackedContent {...content} />
    </span>
  );
}

function InlineActions({ post, linkComments, className }: VariantProps) {
  const model = usePostActionModel(post);

  const commentContent: ReactNode = (
    <>
      <MessageCircleIcon aria-hidden="true" />
      <span aria-hidden="true">{model.commentCount}</span>
      <span className="sr-only">{model.commentLabel}</span>
    </>
  );

  return (
    <div className={cn("-mx-2 flex items-center gap-1", className)}>
      {/* aria-pressed exposes the like as a toggle; the count stays in the accessible name. */}
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={post.likedByMe}
        onClick={model.toggleLike}
        className={cn("tabular-nums", post.likedByMe && "text-highlight-text")}
      >
        <HeartIcon aria-hidden="true" className={cn(post.likedByMe && "fill-highlight")} />
        <span aria-hidden="true">{model.likeCount}</span>
        <span className="sr-only">{model.likeLabel}</span>
      </Button>

      {linkComments ? (
        <Button asChild variant="ghost" size="sm" className="tabular-nums">
          <Link href={postHref(post.id)}>{commentContent}</Link>
        </Button>
      ) : (
        // On the post page the comments are right there; the count is informational.
        <span className="inline-flex h-8 items-center gap-1.5 px-3 text-[0.8rem] font-medium tabular-nums [&_svg]:size-3.5">
          {commentContent}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={model.shareLabel}
        onClick={model.sharePost}
      >
        <Share2Icon aria-hidden="true" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={model.saveLabel}
        aria-pressed={post.savedByMe}
        onClick={model.toggleSave}
        className={cn("ml-auto", post.savedByMe && "text-primary")}
      >
        <BookmarkIcon aria-hidden="true" className={cn(post.savedByMe && "fill-current")} />
      </Button>
    </div>
  );
}
