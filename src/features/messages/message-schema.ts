import { z } from "zod";

/** Maximum message length (CreateMessageDto, FR-MSG-03). */
export const MESSAGE_MAX_LENGTH = 1000;

/**
 * The message composer (FR-MSG-03). Mirrors CreateMessageDto: trimmed, then
 * 1–1000 characters. The length limit is checked on the raw text (what the
 * counter shows), which is never more lenient than the API's check after
 * trimming. Messages are translation keys; the composer translates them.
 */
export const messageFormSchema = z.object({
  body: z
    .string()
    .max(MESSAGE_MAX_LENGTH, { error: "validation.messageTooLong" })
    .trim()
    .min(1, { error: "validation.messageRequired" }),
});

/** Values of the composer, after trimming. */
export type MessageFormValues = z.infer<typeof messageFormSchema>;

/** Whether the composer's raw text could be sent: not blank and within the limit. */
export function canSendMessage(raw: string): boolean {
  return raw.trim().length > 0 && raw.length <= MESSAGE_MAX_LENGTH;
}
