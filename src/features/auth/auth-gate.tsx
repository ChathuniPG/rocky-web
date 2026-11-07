"use client";

import { CircleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import { isSessionExpiredError } from "@/lib/api/errors";

import { AppShellSkeleton } from "./app-shell-skeleton";
import { useAuth } from "./auth-provider";

/**
 * Renders the signed-in app only once the current user is known (FR-AUTH-07,
 * ADR-013). Until then it shows a skeleton; this is also what prerendering
 * produces, because the user is only known in the browser. If the user can't be
 * loaded for a reason other than an ended session, it offers a retry.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user, error } = useAuth();

  if (user) return children;
  // An ended session is already redirecting to /login; keep the skeleton until it does.
  if (error && !isSessionExpiredError(error)) return <SessionErrorScreen />;
  return <AppShellSkeleton />;
}

function SessionErrorScreen() {
  const t = useTranslations();
  const { retry, logout, isLoggingOut } = useAuth();

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <EmptyState
        icon={CircleAlertIcon}
        title={t("auth.sessionError.title")}
        description={t("auth.sessionError.description")}
        className="w-full max-w-md"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={retry}>{t("common.retry")}</Button>
            {/* Lets a user stuck here (e.g. a disabled account, 403) get back to the login page. */}
            <Button variant="outline" onClick={logout} loading={isLoggingOut}>
              {t("auth.logout.action")}
            </Button>
          </div>
        }
      />
    </main>
  );
}
