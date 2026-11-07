"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/i18n/i18n-provider";

import { CreatePostForm } from "./create-post-form";

/**
 * The create-post dialog opened from the sidebar's Post item on every page
 * (design.md 7.1, FR-POST-01). `children` is the trigger, wrapped in a
 * `DialogTrigger` by the caller. The form only exists while the dialog is open,
 * so each opening starts fresh and closing cancels an upload in progress.
 */
export function CreatePostDialog({ children }: { children: ReactNode }) {
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
      {children}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createPost.title")}</DialogTitle>
          <DialogDescription>{t("createPost.description")}</DialogDescription>
        </DialogHeader>
        <CreatePostForm onCreated={() => setOpen(false)} onCloseLockChange={setCloseLocked} />
      </DialogContent>
    </Dialog>
  );
}
