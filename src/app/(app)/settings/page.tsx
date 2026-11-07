import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.settings.title") };

/** Settings: theme, notifications, language, log out (FR-SET-01..04). Placeholder. */
export default function SettingsPage() {
  return (
    <>
      <PageHeader title={t("pages.settings.title")} />
      <ComingSoon />
    </>
  );
}
