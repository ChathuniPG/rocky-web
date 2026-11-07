"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SendHorizontalIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { CharacterCounter } from "@/components/character-counter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";

import { COMMENT_MAX_LENGTH, commentFormSchema, type CommentFormValues } from "./comment-schema";
import { useAddComment } from "./use-comment-mutations";

type CommentFormInput = { body: string };

/**
 * The add-comment box under a post (FR-FEED-06): 1–500 characters after
 * trimming, a live counter, and a busy button that blocks double submits.
 * Ctrl/⌘+Enter submits; plain Enter adds a line break.
 */
export function CommentForm({ postId }: { postId: string }) {
  const t = useTranslations();
  const addComment = useAddComment(postId);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CommentFormInput, unknown, CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    // Validated on submit only: an empty box isn't an error until you try to send it.
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { body: "" },
  });

  // useWatch re-renders only this form as the user types, for the counter.
  const body = useWatch({ control, name: "body" });

  const submit = handleSubmit((values) => {
    if (addComment.isPending) return;
    addComment.mutate(values.body, {
      // Cleared only after success, so a failed comment can be retried as is.
      onSuccess: () => reset({ body: "" }),
    });
  });

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submit();
    }
  }

  const errorKey = errors.body?.message as TranslationKey | undefined;
  const errorId = "comment-body-error";
  const counterId = "comment-body-counter";

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-2">
      <Label htmlFor="comment-body" className="sr-only">
        {t("comments.label")}
      </Label>
      <Textarea
        id="comment-body"
        placeholder={t("comments.placeholder")}
        rows={2}
        aria-invalid={Boolean(errorKey)}
        aria-describedby={[errorKey ? errorId : null, counterId].filter(Boolean).join(" ")}
        onKeyDown={onKeyDown}
        className="max-h-60 resize-none"
        {...register("body")}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {errorKey ? (
            <p id={errorId} className="text-sm text-destructive">
              {t(errorKey, { max: COMMENT_MAX_LENGTH })}
            </p>
          ) : null}
          <CharacterCounter id={counterId} count={body.length} max={COMMENT_MAX_LENGTH} />
        </div>
        <Button type="submit" size="sm" loading={addComment.isPending}>
          <SendHorizontalIcon aria-hidden="true" />
          {t("comments.submit")}
        </Button>
      </div>
    </form>
  );
}
