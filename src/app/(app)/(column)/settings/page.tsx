import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { AccountSetting } from "@/features/settings/account-setting";
import { LanguageSetting } from "@/features/settings/language-setting";
import { NotificationsSetting } from "@/features/settings/notifications-setting";
import { ThemeSetting } from "@/features/settings/theme-setting";
import { DocumentTitle } from "@/i18n/document-title";
import { getTranslations } from "@/i18n/server";
import { TranslatedText } from "@/i18n/translated-text";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.settings.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/** Settings: theme, notifications, language and log out (FR-SET-01..04). */
export default function SettingsPage() {
  return (
    <>
      <DocumentTitle id="pages.settings.title" />
      <PageHeader title={<TranslatedText id="pages.settings.title" />} />
      <div className="space-y-6">
        <ThemeSetting />
        <NotificationsSetting />
        <LanguageSetting />
        <AccountSetting />
      </div>
    </>
  );
}
