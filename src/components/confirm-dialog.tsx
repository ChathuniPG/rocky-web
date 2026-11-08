"use client";

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
}: ConfirmDialogProps) {
  const t = useTranslations();

  return (
    <AlertDialog
      open={open}
      // Escape or Cancel mid-request would hide a request that still completes.
      onOpenChange={(next) => {
        if (!isPending) onOpenChange(next);
      }}
    >
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
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
