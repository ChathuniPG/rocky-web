import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentTitle } from "@/i18n/document-title";
import type { TranslationKey } from "@/i18n/translate";
import { TranslatedText } from "@/i18n/translated-text";

import { AuthSwitchLink } from "./auth-switch-link";

type AuthFormCardProps = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  /** The form itself (a client component). */
  children: ReactNode;
  switchPromptKey: TranslationKey;
  switchLinkKey: TranslationKey;
  switchHref: "/login" | "/signup";
};

/**
 * Card around the login and sign-up forms: heading, short description, the
 * form, and a link to the other form. A server component; only the form and
 * the link are client components. The text is passed as translation keys and
 * rendered by <TranslatedText />, so it follows a language switch (FR-SET-03).
 * The heading key also sets the tab title in the active language.
 */
export function AuthFormCard({
  titleKey,
  descriptionKey,
  children,
  switchPromptKey,
  switchLinkKey,
  switchHref,
}: AuthFormCardProps) {
  return (
    <Card>
      <DocumentTitle id={titleKey} />
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-bold">
            <TranslatedText id={titleKey} />
          </h1>
        </CardTitle>
        <CardDescription>
          <TranslatedText id={descriptionKey} />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        <p className="text-sm text-muted-foreground">
          <TranslatedText id={switchPromptKey} />{" "}
          <AuthSwitchLink href={switchHref}>
            <TranslatedText id={switchLinkKey} />
          </AuthSwitchLink>
        </p>
      </CardContent>
    </Card>
  );
}
