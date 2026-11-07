import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.messages.title") };

/** Conversation list (FR-MSG-01). Placeholder. */
export default function MessagesPage() {
  return (
    <>
      <PageHeader title={t("pages.messages.title")} />
      <ComingSoon />
    </>
  );
}
