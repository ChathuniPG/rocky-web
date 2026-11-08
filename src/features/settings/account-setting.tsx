"use client";

import { LogoutButton } from "@/features/auth/logout-button";
import { useTranslations } from "@/i18n/i18n-provider";

import { SettingsSection } from "./settings-section";

/** Logging out (FR-SET-04), with a confirmation. */
export function AccountSetting() {
  const t = useTranslations();
  return (
    <SettingsSection
      id="account"
      title={t("settings.account.title")}
      description={t("settings.account.description")}
    >
      <LogoutButton />
    </SettingsSection>
  );
}
