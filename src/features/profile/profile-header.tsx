"use client";

import { UserAvatar } from "@/components/user-avatar";
import { FollowButton } from "@/features/users/follow-button";
import { useLocale, useTranslations } from "@/i18n/i18n-provider";
import type { Profile } from "@/lib/api/types";
import { formatCount } from "@/lib/format/count";

import { EditProfileDialog } from "./edit-profile-dialog";
import { MessageButton } from "./message-button";

/**
 * The top of a profile (FR-PROF-01): avatar, display name, @username, counts
 * and bio, with Edit Profile on your own profile (FR-PROF-04) and Follow and
 * Message on others (FR-PROF-05, FR-PROF-06).
 */
export function ProfileHeader({ profile }: { profile: Profile }) {
  return (
    <section
      aria-labelledby="profile-name"
      className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6"
    >
      {/* The name heading follows right after, so the avatar's own name would repeat it. */}
      <span aria-hidden="true" className="shrink-0">
        <UserAvatar name={profile.displayName} src={profile.avatarUrl} size="xl" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="min-w-0">
          <h2 id="profile-name" className="text-xl font-bold break-words">
            {profile.displayName}
          </h2>
          <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
        </div>

        <ProfileCounts profile={profile} />

        {profile.bio ? (
          // pre-line keeps the line breaks people type; break-words stops long words overflowing.
          <p className="text-sm break-words whitespace-pre-line">{profile.bio}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {profile.isMe ? (
            <EditProfileDialog profile={profile} />
          ) : (
            <>
              <FollowButton user={profile} size="md" />
              <MessageButton user={profile} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/** Post, follower and following counts as a description list: value above, label below. */
function ProfileCounts({ profile }: { profile: Profile }) {
  const t = useTranslations();
  const locale = useLocale();
  const counts = [
    { key: "posts", value: profile.postCount, label: t("profile.counts.posts") },
    { key: "followers", value: profile.followerCount, label: t("profile.counts.followers") },
    { key: "following", value: profile.followingCount, label: t("profile.counts.following") },
  ] as const;

  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2">
      {counts.map((count) => (
        // dd before dt visually (flex-col-reverse), so the number leads; the DOM keeps dt first.
        <div key={count.key} className="flex flex-col-reverse">
          <dt className="text-xs text-muted-foreground">{count.label}</dt>
          <dd className="text-base font-semibold tabular-nums">
            {formatCount(count.value, locale)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
