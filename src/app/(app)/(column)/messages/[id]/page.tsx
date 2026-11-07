import type { Metadata } from "next";
import { Suspense } from "react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { ListRowSkeleton } from "@/components/skeletons";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.conversation.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * A conversation thread (FR-MSG-02..04). Placeholder. The param-dependent part
 * sits in Suspense: under cacheComponents the conversation id is only known at
 * request time, so the header and skeleton form the prerendered shell.
 */
export default function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  return (
    <>
      <PageHeader title={t("pages.conversation.title")} />
      <Suspense fallback={<ListRowSkeleton />}>
        <ConversationPlaceholder params={params} />
      </Suspense>
    </>
  );
}

async function ConversationPlaceholder({ params }: Pick<PageProps<"/messages/[id]">, "params">) {
  const { id } = await params;
  return <ComingSoon title={id} />;
}
