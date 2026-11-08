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

import {
  canSendMessage,
  MESSAGE_MAX_LENGTH,
  messageFormSchema,
  type MessageFormValues,
} from "./message-schema";

type MessageFormInput = { body: string };

const FIELD_ID = "message-body";
const COUNTER_ID = "message-body-counter";
const HINT_ID = "message-body-hint";
const ERROR_ID = "message-body-error";

/**
 * The message box under a thread (FR-MSG-03): Enter sends, Shift+Enter adds
 * a line break, 1–1000 characters with a live counter, and Send stays
 * disabled while there is nothing to send. Sending is optimistic, so the box
 * clears at once and keeps the focus for the next message.
 */
export function MessageComposer({ onSend }: { onSend: (body: string) => void }) {
  const t = useTranslations();
  const { register, handleSubmit, reset, setFocus, control } = useForm<
    MessageFormInput,
    unknown,
    MessageFormValues
  >({
    resolver: zodResolver(messageFormSchema),
    defaultValues: { body: "" },
  });

  // useWatch re-renders only this form as the user types, for the counter.
  const body = useWatch({ control, name: "body" });
  const canSend = canSendMessage(body);
  const isTooLong = body.length > MESSAGE_MAX_LENGTH;

  const submit = handleSubmit((values) => {
    onSend(values.body);
    reset({ body: "" });
    setFocus("body");
  });

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: Enter confirms a word in an input method editor (e.g. some
    // Sinhala keyboards); it must not send the message.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canSend) void submit();
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) void submit(event);
      }}
      className="flex flex-col gap-1 border-t pt-3"
    >
      <Label htmlFor={FIELD_ID} className="sr-only">
        {t("messages.composer.label")}
      </Label>
      <div className="flex items-end gap-2">
        <Textarea
          id={FIELD_ID}
          rows={1}
          placeholder={t("messages.composer.placeholder")}
          aria-invalid={isTooLong || undefined}
          aria-describedby={`${isTooLong ? ERROR_ID : HINT_ID} ${COUNTER_ID}`}
          onKeyDown={onKeyDown}
          className="max-h-40 min-h-10 resize-none"
          {...register("body")}
        />
        <Button
          type="submit"
          size="icon"
          aria-label={t("messages.composer.send")}
          disabled={!canSend}
          // Sending clears the field, which disables the button under keyboard focus.
          focusableWhenDisabled
          className="shrink-0"
        >
          <SendHorizontalIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isTooLong ? (
            <p id={ERROR_ID} className="text-xs text-destructive">
              {t("validation.messageTooLong", { max: MESSAGE_MAX_LENGTH })}
            </p>
          ) : (
            <p id={HINT_ID} className="text-xs text-muted-foreground">
              {t("messages.composer.hint")}
            </p>
          )}
        </div>
        <CharacterCounter id={COUNTER_ID} count={body.length} max={MESSAGE_MAX_LENGTH} />
      </div>
    </form>
  );
}
