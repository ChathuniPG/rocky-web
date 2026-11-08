"use client";

import { LogOutIcon } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";

import { useAuth } from "./auth-provider";

/**
 * Logs the user out after a confirmation (FR-AUTH-06, FR-SET-04). The dialog
 * stays open with a spinner while the request runs; success loads /login as a
 * new page (ADR-014), a failure shows a toast and leaves the dialog open so the
 * user can try again or cancel.
 */
export function LogoutButton() {
  const t = useTranslations();
  const { logout, isLoggingOut } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setIsConfirming(true)}>
        <LogOutIcon aria-hidden="true" />
        {t("auth.logout.action")}
      </Button>
      <ConfirmDialog
        open={isConfirming}
        onOpenChange={setIsConfirming}
        title={t("auth.logout.confirmTitle")}
        description={t("auth.logout.confirmDescription")}
        confirmLabel={t("auth.logout.action")}
        confirmVariant="primary"
        onConfirm={logout}
        isPending={isLoggingOut}
      />
    </>
  );
}
