import type { Metadata } from "next";
import { Suspense } from "react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { ProfileHeaderSkeleton } from "@/components/skeletons";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.profile.title") };

/**
 * A user's profile with Posts and Saved tabs (FR-PROF-01..06). Placeholder. The
 * username is only known at request time, so the part that reads it streams in
 * behind a skeleton (cacheComponents).
 */
export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <>
      <PageHeader title={t("pages.profile.title")} />
      <Suspense fallback={<ProfileHeaderSkeleton />}>
        <ProfilePlaceholder params={params} />
      </Suspense>
    </>
  );
}

async function ProfilePlaceholder({ params }: Pick<PageProps<"/u/[username]">, "params">) {
  const { username } = await params;
  return <ComingSoon title={`@${decodeURIComponent(username)}`} />;
}
