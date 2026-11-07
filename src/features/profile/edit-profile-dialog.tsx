"use client";

import { useCallback, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "@/i18n/i18n-provider";
import type { Profile } from "@/lib/api/types";

import { EditProfileForm } from "./edit-profile-form";

/**
 * The owner's Edit Profile button and dialog (FR-PROF-04). The form only
 * exists while the dialog is open, so each opening starts from the current
 * profile and closing cancels an avatar upload in progress. Closing is blocked
 * while the changes themselves are being saved.
 */
export function EditProfileDialog({ profile }: { profile: Profile }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  // A ref, not state: it only gates closing and never changes what is shown.
  const closeLockedRef = useRef(false);
  const setCloseLocked = useCallback((locked: boolean) => {
    closeLockedRef.current = locked;
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && closeLockedRef.current) return;
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          {t("profile.edit.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("profile.edit.title")}</DialogTitle>
          <DialogDescription>{t("profile.edit.description")}</DialogDescription>
        </DialogHeader>
        <EditProfileForm
          profile={profile}
          onSaved={() => setOpen(false)}
          onCloseLockChange={setCloseLocked}
        />
      </DialogContent>
    </Dialog>
  );
}
