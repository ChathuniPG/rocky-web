import type { Metadata } from "next";

import { AuthFormCard } from "@/features/auth/auth-form-card";
import { SignupForm } from "@/features/auth/signup-form";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.signup.title") };

/**
 * Sign-up (FR-AUTH-01..02). A server component for the static parts; the form
 * is a client component because it handles input and submission.
 */
export default function SignupPage() {
  return (
    <AuthFormCard
      titleKey="pages.signup.title"
      descriptionKey="pages.signup.description"
      switchPromptKey="pages.signup.switchPrompt"
      switchLinkKey="pages.signup.switchLink"
      switchHref="/login"
    >
      <SignupForm />
    </AuthFormCard>
  );
}
