import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.notifications.title") };

/** Notifications list (FR-NOTF-02..03). Placeholder. */
export default function NotificationsPage() {
  return (
    <>
      <PageHeader title={t("pages.notifications.title")} />
      <ComingSoon />
    </>
  );
}
