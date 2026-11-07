import { z } from "zod";

/** Maximum caption length (FR-POST-01; CreatePostDto and UpdatePostDto maxLength). */
export const CAPTION_MAX_LENGTH = 2200;

/*
 * The length is checked before trimming, on exactly what the user sees in the
 * counter. JavaScript counts UTF-16 units, never fewer characters than the
 * server does, so a caption accepted here is never rejected for length there.
 * Messages are translation keys; the form translates them.
 */

/** A post caption: optional, at most 2,200 characters, trimmed before sending. */
export const captionSchema = z
  .string()
  .max(CAPTION_MAX_LENGTH, { error: "validation.captionTooLong" })
  .trim();

/** The edit-caption form (FR-POST-04). */
export const editCaptionFormSchema = z.object({ caption: captionSchema });

/** Values of the edit-caption form. */
export type EditCaptionFormValues = z.infer<typeof editCaptionFormSchema>;
