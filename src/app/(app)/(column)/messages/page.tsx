import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ConversationList } from "@/features/messages/conversation-list";
import { getTranslations } from "@/i18n/server";
import { TranslatedText } from "@/i18n/translated-text";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.messages.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/** The conversation list (FR-MSG-01, FR-MSG-05); it loads its data in the browser. */
export default function MessagesPage() {
  return (
    <>
      <PageHeader title={<TranslatedText id="pages.messages.title" />} />
      <ConversationList />
    </>
  );
}
