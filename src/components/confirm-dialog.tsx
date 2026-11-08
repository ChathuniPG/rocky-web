"use client";

import { useRef } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Red for destructive actions (the default); "primary" for ones that only end something, like logging out. */
  confirmVariant?: "destructive" | "primary";
  /** Runs the action. The dialog stays open (and can't be dismissed) while `isPending`. */
  onConfirm: () => void;
  isPending: boolean;
  /** Where focus goes when the dialog closes; by default it returns to what had focus before. */
  onCloseAutoFocus?: (event: Event) => void;
  /**
   * Moves focus somewhere sensible when the element that opened the dialog is gone,
   * e.g. the delete button of a comment that was just deleted.
   */
  fallbackFocus?: () => void;
};

/**
 * Asks before a destructive action, e.g. deleting a post or comment
 * (FR-POST-05), or before logging out (FR-SET-04). An alert dialog: focus starts on Cancel and clicking outside
 * doesn't dismiss it. The confirm button is a plain button rather than the
 * dialog's own Action, which would close the dialog before the request finished.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "destructive",
  onConfirm,
  isPending,
  onCloseAutoFocus,
  fallbackFocus,
}: ConfirmDialogProps) {
  const t = useTranslations();
  // These dialogs are opened from state, not a Radix trigger, so Radix has no
  // trigger to return focus to and would leave it on <body> (WCAG 2.4.3). The
  // element that had focus as the dialog opened is remembered instead.
  const openerRef = useRef<HTMLElement | null>(null);

  function rememberOpener() {
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  function returnFocus(event: Event) {
    if (onCloseAutoFocus) {
      onCloseAutoFocus(event);
      return;
    }
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) {
      event.preventDefault();
      opener.focus();
    } else if (fallbackFocus) {
      // Also runs when the dialog unmounts with its opener, once the focus trap is gone.
      event.preventDefault();
      fallbackFocus();
    }
  }

  return (
    <AlertDialog
      open={open}
      // Escape or Cancel mid-request would hide a request that still completes.
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent onOpenAutoFocus={rememberOpener} onCloseAutoFocus={returnFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t("common.cancel")}</AlertDialogCancel>
          <Button variant={confirmVariant} loading={isPending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
