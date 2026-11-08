"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { BackButton } from "@/features/navigation/back-button";
import { profileHref } from "@/features/navigation/nav-items";
import { useTranslations } from "@/i18n/i18n-provider";
import type { Conversation } from "@/lib/api/types";

type ThreadHeaderProps = {
  /** The conversation, null if it couldn't be found, undefined while it loads. */
  conversation: Conversation | null | undefined;
};

/**
 * The thread's header: Back (to the previous page, or to Messages when the
 * thread was opened directly) and the other participant, linking to their
 * profile. The page's heading names the conversation for screen readers.
 */
export function ThreadHeader({ conversation }: ThreadHeaderProps) {
  const t = useTranslations();
  const otherUser = conversation?.otherUser;

  return (
    <header className="flex items-center gap-2 border-b pb-3">
      <BackButton tone="plain" fallbackHref="/messages" />
      {otherUser ? (
        <>
          <h1 className="sr-only">{t("messages.thread.title", { name: otherUser.displayName })}</h1>
          <Link
            href={profileHref(otherUser.username)}
            aria-label={t("messages.thread.viewProfile", { name: otherUser.displayName })}
            className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1 transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring"
          >
            <span aria-hidden="true" className="shrink-0">
              <UserAvatar name={otherUser.displayName} src={otherUser.avatarUrl} size="sm" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold">
                {otherUser.displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                @{otherUser.username}
              </span>
            </span>
          </Link>
        </>
      ) : conversation === null ? (
        // Accessible, but not found in the list (should not happen): a generic title.
        <h1 className="text-base font-semibold">{t("pages.conversation.title")}</h1>
      ) : (
        <div aria-hidden="true" className="flex items-center gap-3 px-2 py-1">
          <Skeleton className="size-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      )}
    </header>
  );
}
