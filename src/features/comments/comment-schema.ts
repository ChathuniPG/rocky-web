import { z } from "zod";

/** Maximum comment length (CreateCommentDto maxLength). */
export const COMMENT_MAX_LENGTH = 500;

/**
 * The add-comment form (FR-FEED-06). Mirrors CreateCommentDto: trimmed, then
 * 1–500 characters. The length limit is checked on the raw text (what the
 * counter shows), which is never more lenient than the API's check after
 * trimming. Messages are translation keys; the form translates them.
 */
export const commentFormSchema = z.object({
  body: z
    .string()
    .max(COMMENT_MAX_LENGTH, { error: "validation.commentTooLong" })
    .trim()
    .min(1, { error: "validation.commentRequired" }),
});

/** Values of the add-comment form, after trimming. */
export type CommentFormValues = z.infer<typeof commentFormSchema>;
