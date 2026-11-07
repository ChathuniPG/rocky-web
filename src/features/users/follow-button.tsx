"use client";

import { UserCheckIcon, UserPlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { useToggleFollow, type FollowTarget } from "./use-toggle-follow";

type FollowButtonProps = {
  user: FollowTarget & { isFollowing: boolean };
  size?: "sm" | "md";
  className?: string;
};

/**
 * Follow toggle for another user (FR-PROF-05). A toggle button (aria-pressed)
 * whose visible text always shows the current state, "Follow" or "Following";
 * it never changes on hover, which voice-control, keyboard and touch users
 * couldn't rely on. The accessible name starts with that visible text (WCAG
 * 2.5.3) and adds the person's name, so a list of buttons is distinguishable.
 * Clicks are optimistic (useToggleFollow), so the button is never disabled
 * while the request runs.
 */
export function FollowButton({ user, size = "sm", className }: FollowButtonProps) {
  const t = useTranslations();
  const toggleFollow = useToggleFollow(user);
  const { isFollowing } = user;
  const Icon = isFollowing ? UserCheckIcon : UserPlusIcon;

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? "outline" : "primary"}
      aria-pressed={isFollowing}
      aria-label={t(isFollowing ? "follow.followingName" : "follow.followName", {
        name: user.displayName,
      })}
      onClick={() => toggleFollow.mutate(!isFollowing)}
      // A fixed minimum width stops the row from jumping when the label changes.
      className={cn("min-w-28", className)}
    >
      <Icon aria-hidden="true" />
      {t(isFollowing ? "follow.following" : "follow.follow")}
    </Button>
  );
}
