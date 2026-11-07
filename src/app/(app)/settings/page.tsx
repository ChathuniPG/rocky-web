import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { LogoutButton } from "@/features/auth/logout-button";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.settings.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * Settings: theme, notifications, language, log out (FR-SET-01..04). Only log out
 * works so far; the rest of the page comes with #14.
 */
export default function SettingsPage() {
  return (
    <>
      <PageHeader title={t("pages.settings.title")} />
      <div className="space-y-6">
        <ComingSoon />
        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}
