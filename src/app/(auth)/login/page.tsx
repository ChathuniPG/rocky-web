import type { Metadata } from "next";

import { getTranslations } from "@/i18n/server";

import { AuthPlaceholderCard } from "../auth-placeholder-card";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.login.title") };

/** Login (FR-AUTH-03). Placeholder until the auth issue. */
export default function LoginPage() {
  return (
    <AuthPlaceholderCard
      title={t("pages.login.title")}
      description={t("pages.login.description")}
      switchPrompt={t("pages.login.switchPrompt")}
      switchLink={t("pages.login.switchLink")}
      switchHref="/signup"
    />
  );
}
