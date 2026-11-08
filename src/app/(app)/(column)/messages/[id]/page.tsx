import type { Metadata } from "next";
import { Suspense } from "react";

import { ListRowSkeleton } from "@/components/skeletons";
import { ConversationThread } from "@/features/messages/conversation-thread";
import { DocumentTitle } from "@/i18n/document-title";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.conversation.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * A conversation thread (FR-MSG-02..05). Under cacheComponents the
 * conversation id is only known at request time, so the part that reads it
 * streams in behind a skeleton; the thread itself loads in the browser.
 */
export default function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  return (
    <>
      <DocumentTitle id="pages.conversation.title" />
      <Suspense fallback={<ListRowSkeleton />}>
        <ThreadForParams params={params} />
      </Suspense>
    </>
  );
}

async function ThreadForParams({ params }: Pick<PageProps<"/messages/[id]">, "params">) {
  const { id } = await params;
  return <ConversationThread conversationId={id} />;
}
