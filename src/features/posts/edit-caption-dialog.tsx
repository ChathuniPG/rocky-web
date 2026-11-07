"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { CharacterCounter } from "@/components/character-counter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";
import type { Post } from "@/lib/api/types";

import {
  CAPTION_MAX_LENGTH,
  editCaptionFormSchema,
  type EditCaptionFormValues,
} from "./caption-schema";
import { useEditCaption } from "./use-post-owner-mutations";

type EditCaptionDialogProps = {
  post: Pick<Post, "id" | "caption">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where focus goes when the dialog closes; by default it returns to what had focus before. */
  onCloseAutoFocus?: (event: Event) => void;
};

/** Dialog for editing a post's caption (FR-POST-04), with a 2,200-character counter. */
export function EditCaptionDialog({
  post,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: EditCaptionDialogProps) {
  const t = useTranslations();
  const editCaption = useEditCaption(post.id);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing mid-save would hide whether the save worked.
        if (!editCaption.isPending) onOpenChange(next);
      }}
    >
      {/* Radix focuses the first field (the caption) when the dialog opens. */}
      <DialogContent className="sm:max-w-lg" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{t("editCaption.title")}</DialogTitle>
          <DialogDescription>{t("editCaption.description")}</DialogDescription>
        </DialogHeader>
        {/* The form only exists while the dialog is open, so it starts from the current caption each time. */}
        <EditCaptionForm
          initialCaption={post.caption}
          isPending={editCaption.isPending}
          onSubmit={(caption) =>
            editCaption.mutate(caption, { onSuccess: () => onOpenChange(false) })
          }
        />
      </DialogContent>
    </Dialog>
  );
}

function EditCaptionForm({
  initialCaption,
  isPending,
  onSubmit,
}: {
  initialCaption: string;
  isPending: boolean;
  onSubmit: (caption: string) => void;
}) {
  const t = useTranslations();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EditCaptionFormValues, unknown, EditCaptionFormValues>({
    resolver: zodResolver(editCaptionFormSchema),
    mode: "onChange",
    defaultValues: { caption: initialCaption },
  });
  const caption = useWatch({ control, name: "caption" });

  const errorKey = errors.caption?.message as TranslationKey | undefined;
  const errorId = "edit-caption-error";
  const counterId = "edit-caption-counter";

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit((values) => onSubmit(values.caption))(event)}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-caption">{t("editCaption.label")}</Label>
        <Textarea
          id="edit-caption"
          rows={5}
          aria-invalid={Boolean(errorKey)}
          aria-describedby={[errorKey ? errorId : null, counterId].filter(Boolean).join(" ")}
          className="max-h-80"
          {...register("caption")}
        />
        {errorKey ? (
          <p id={errorId} className="text-sm text-destructive">
            {t(errorKey, { max: CAPTION_MAX_LENGTH })}
          </p>
        ) : null}
        <CharacterCounter
          id={counterId}
          count={caption.length}
          max={CAPTION_MAX_LENGTH}
          className="self-end"
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" disabled={isPending}>
            {t("common.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" loading={isPending}>
          {t("editCaption.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
