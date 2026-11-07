import type { Metadata } from "next";

import { AuthFormCard } from "@/features/auth/auth-form-card";
import { LoginForm } from "@/features/auth/login-form";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.login.title") };

/**
 * Login (FR-AUTH-03). A server component for the static parts; the form is a
 * client component because it handles input and submission.
 */
export default function LoginPage() {
  return (
    <AuthFormCard
      title={t("pages.login.title")}
      description={t("pages.login.description")}
      switchPrompt={t("pages.login.switchPrompt")}
      switchLink={t("pages.login.switchLink")}
      switchHref="/signup"
    >
      <LoginForm />
    </AuthFormCard>
  );
}
