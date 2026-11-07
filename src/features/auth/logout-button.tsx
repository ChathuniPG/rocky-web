"use client";

import { LogOutIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";

import { useAuth } from "./auth-provider";

/**
 * Logs the user out (FR-AUTH-06). Shows a spinner and is disabled while the
 * request runs, so it can't be sent twice.
 */
export function LogoutButton() {
  const t = useTranslations();
  const { logout, isLoggingOut } = useAuth();

  return (
    <Button variant="outline" onClick={logout} loading={isLoggingOut}>
      <LogOutIcon aria-hidden="true" />
      {t("auth.logout.action")}
    </Button>
  );
}
