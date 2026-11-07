import type { Metadata } from "next";

import { getTranslations } from "@/i18n/server";

import { AuthPlaceholderCard } from "../auth-placeholder-card";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.signup.title") };

/** Sign-up (FR-AUTH-01..02). Placeholder until the auth issue. */
export default function SignupPage() {
  return (
    <AuthPlaceholderCard
      title={t("pages.signup.title")}
      description={t("pages.signup.description")}
      switchPrompt={t("pages.signup.switchPrompt")}
      switchLink={t("pages.signup.switchLink")}
      switchHref="/login"
    />
  );
}
