import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { AuthSwitchLink } from "./auth-switch-link";

type AuthFormCardProps = {
  title: string;
  description: string;
  /** The form itself (a client component). */
  children: ReactNode;
  switchPrompt: string;
  switchLink: string;
  switchHref: "/login" | "/signup";
};

/**
 * Card around the login and sign-up forms: heading, short description, the
 * form, and a link to the other form. A server component; only the form and
 * the link are client components.
 */
export function AuthFormCard({
  title,
  description,
  children,
  switchPrompt,
  switchLink,
  switchHref,
}: AuthFormCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-bold">{title}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        <p className="text-sm text-muted-foreground">
          {switchPrompt} <AuthSwitchLink href={switchHref}>{switchLink}</AuthSwitchLink>
        </p>
      </CardContent>
    </Card>
  );
}
