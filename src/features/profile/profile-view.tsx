"use client";

import { BookmarkIcon, CameraIcon, CircleAlertIcon, UserXIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/empty-state";
import { ProfileHeaderSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "@/i18n/i18n-provider";
import { isApiError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { Profile } from "@/lib/api/types";

import { PostGrid, PostGridSkeleton } from "./post-grid";
import { ProfileHeader } from "./profile-header";
import { isValidUsername, parseProfileTab, profileTabHref } from "./profile-params";
import { useProfile, useSavedPosts, useUserPosts } from "./use-profile-queries";

/**
 * A user's profile (FR-PROF-01..06): the header, then the Posts tab and, on
 * your own profile, the Saved tab. The tab lives in the URL (?tab=saved).
 * Reads useSearchParams, so the page renders it inside Suspense (cacheComponents).
 */
export function ProfileView({ username }: { username: string }) {
  const t = useTranslations();
  const isValid = isValidUsername(username);
  const profileQuery = useProfile(username, isValid);

  const isNotFound =
    !isValid || isApiError(profileQuery.error, 404) || isApiError(profileQuery.error, 400);
  if (isNotFound) return <ProfileNotFound />;

  if (profileQuery.isPending) {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          {t("profile.loading")}
        </p>
        <ProfileViewSkeleton />
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title={t("profile.errorTitle")}
        description={t(mapApiErrorToMessageKey(profileQuery.error))}
        action={
          <Button loading={profileQuery.isFetching} onClick={() => void profileQuery.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ProfileHeader profile={profileQuery.data} />
      <ProfileTabs profile={profileQuery.data} />
    </div>
  );
}

/** Posts and (own profile only) Saved, each an infinite grid; Radix mounts only the active one. */
function ProfileTabs({ profile }: { profile: Profile }) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const tab = parseProfileTab(searchParams.get("tab"), profile.isMe);

  function selectTab(value: string) {
    // The History API updates useSearchParams without a server request; replacing
    // the entry means switching tabs adds no Back steps.
    window.history.replaceState(
      null,
      "",
      profileTabHref(profile.username, parseProfileTab(value, profile.isMe)),
    );
  }

  return (
    <Tabs value={tab} onValueChange={selectTab}>
      <TabsList variant="line" aria-label={t("profile.tabs.label")}>
        <TabsTrigger value="posts">{t("profile.tabs.posts")}</TabsTrigger>
        {profile.isMe ? <TabsTrigger value="saved">{t("profile.tabs.saved")}</TabsTrigger> : null}
      </TabsList>
      <TabsContent value="posts" className="mt-3">
        <UserPostsGrid profile={profile} />
      </TabsContent>
      {profile.isMe ? (
        <TabsContent value="saved" className="mt-3">
          <SavedPostsGrid />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}

function UserPostsGrid({ profile }: { profile: Profile }) {
  const t = useTranslations();
  const query = useUserPosts(profile.username, true);

  return (
    <PostGrid
      query={query}
      label={t("profile.tabs.posts")}
      emptyState={
        <EmptyState
          icon={CameraIcon}
          title={t(profile.isMe ? "profile.empty.ownPostsTitle" : "profile.empty.postsTitle")}
          description={
            profile.isMe
              ? t("profile.empty.ownPostsDescription")
              : t("profile.empty.postsDescription", { username: profile.username })
          }
        />
      }
    />
  );
}

function SavedPostsGrid() {
  const t = useTranslations();
  const query = useSavedPosts(true);

  return (
    <PostGrid
      query={query}
      label={t("profile.tabs.saved")}
      emptyState={
        <EmptyState
          icon={BookmarkIcon}
          title={t("profile.empty.savedTitle")}
          description={t("profile.empty.savedDescription")}
        />
      }
    />
  );
}

/** Shown for a username that doesn't exist (or can't exist). */
function ProfileNotFound() {
  const t = useTranslations();
  return (
    <EmptyState
      icon={UserXIcon}
      title={t("profile.notFound.title")}
      description={t("profile.notFound.description")}
      action={
        <Button asChild variant="outline">
          <Link href="/search">{t("profile.notFound.action")}</Link>
        </Button>
      }
    />
  );
}

/** The whole profile while it loads: header, tabs and grid placeholders (FR-UI-03). */
export function ProfileViewSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-8">
      <ProfileHeaderSkeleton />
      <PostGridSkeleton />
    </div>
  );
}
