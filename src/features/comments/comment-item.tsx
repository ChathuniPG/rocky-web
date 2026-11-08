"use client";

import { Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { RelativeTime } from "@/components/relative-time";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { profileHref } from "@/features/navigation/nav-items";
import { useTranslations } from "@/i18n/i18n-provider";
import type { Comment } from "@/lib/api/types";

import { COMMENT_FIELD_ID } from "./comment-form";
import { useDeleteComment } from "./use-comment-mutations";

/**
 * One comment: author, time and text, plus a delete button on the viewer's own
 * comments (FR-FEED-06; the API also refuses deleting anyone else's, NFR-SEC-02).
 */
export function CommentItem({ comment, postId }: { comment: Comment; postId: string }) {
  const t = useTranslations();
  const currentUser = useCurrentUser();
  const deleteComment = useDeleteComment(postId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { author } = comment;
  const isOwn = author.id === currentUser.id;

  return (
    <article className="flex gap-3 py-3">
      <Link href={profileHref(author.username)} tabIndex={-1} aria-hidden="true">
        <UserAvatar name={author.displayName} src={author.avatarUrl} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-baseline gap-1.5">
          <Link
            href={profileHref(author.username)}
            className="truncate rounded-sm text-sm font-semibold outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
          >
            {author.displayName}
          </Link>
          <RelativeTime dateTime={comment.createdAt} className="shrink-0" />
        </p>
        {/* Plain text: React escapes it; typed line breaks are kept. */}
        <p className="text-sm break-words whitespace-pre-line">{comment.body}</p>
      </div>
      {isOwn ? (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("comments.delete")}
            onClick={() => setConfirmOpen(true)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon aria-hidden="true" />
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title={t("comments.deleteTitle")}
            description={t("comments.deleteDescription")}
            confirmLabel={t("comments.deleteConfirm")}
            isPending={deleteComment.isPending}
            onConfirm={() =>
              deleteComment.mutate(comment.id, { onSuccess: () => setConfirmOpen(false) })
            }
            // Once deleted, the comment and its button are gone; the comment field is
            // the natural next place for focus (WCAG 2.4.3).
            fallbackFocus={() => document.getElementById(COMMENT_FIELD_ID)?.focus()}
          />
        </>
      ) : null}
    </article>
  );
}
