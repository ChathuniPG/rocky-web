"use client";

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/i18n/i18n-provider";

/**
 * Body of the create-post dialog opened from the sidebar's Post item
 * (design.md 7.1). Placeholder only; the upload form arrives in #9. Rendered
 * inside a `<Dialog>` owned by the caller, which also owns the trigger.
 */
export function CreatePostDialogContent() {
  const t = useTranslations();

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{t("createPost.title")}</DialogTitle>
        <DialogDescription>{t("createPost.description")}</DialogDescription>
      </DialogHeader>
    </DialogContent>
  );
}
