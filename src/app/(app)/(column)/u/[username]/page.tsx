import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { ProfileView, ProfileViewSkeleton } from "@/features/profile/profile-view";
import { DocumentTitle } from "@/i18n/document-title";
import { getTranslations } from "@/i18n/server";
import { TranslatedText } from "@/i18n/translated-text";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.profile.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * A user's profile with Posts and Saved tabs (FR-PROF-01..06). The username and
 * the tab are only known at request time, so the part that reads them streams
 * in behind a skeleton (cacheComponents); the profile itself loads in the browser.
 */
export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <>
      <DocumentTitle id="pages.profile.title" />
      <PageHeader title={<TranslatedText id="pages.profile.title" />} />
      <Suspense fallback={<ProfileViewSkeleton />}>
        <ProfileForParams params={params} />
      </Suspense>
    </>
  );
}

async function ProfileForParams({ params }: Pick<PageProps<"/u/[username]">, "params">) {
  const { username } = await params;
  return <ProfileView username={decodeUsername(username)} />;
}

/** The URL segment as typed; a malformed escape (e.g. "%E0%A4") can't be a username. */
function decodeUsername(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return "";
  }
}
