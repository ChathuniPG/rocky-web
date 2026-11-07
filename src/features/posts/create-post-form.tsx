"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CharacterCounter } from "@/components/character-counter";
import { FormErrorAlert } from "@/components/form-error-alert";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useLocale, useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey, TranslationValues } from "@/i18n/translate";
import { isSessionExpiredError } from "@/lib/api/errors";
import type { MediaType } from "@/lib/api/types";
import { uploadFile } from "@/lib/api/upload";
import { formatFileSize } from "@/lib/format/file-size";

import { CAPTION_MAX_LENGTH, captionFormSchema, type CaptionFormValues } from "./caption-schema";
import { mapCreatePostError, type CreatePostError } from "./map-create-post-error";
import { MediaDropzone, useFilePicker } from "./media-dropzone";
import { MediaPreview } from "./media-preview";
import { validateMediaFile } from "./media-validation";
import { postHref } from "./share-post";
import { useCreatePost } from "./use-create-post";

/** Where a submission is: idle, sending the file, or creating the post from it. */
type Phase = "idle" | "uploading" | "creating";

/** The chosen file, with a temporary blob URL for its preview. */
type SelectedMedia = { file: File; mediaType: MediaType; previewUrl: string };

/** A file that already reached Storage, so a retry after a failed create skips the upload. */
type UploadedMedia = { file: File; path: string };

type FileError = { key: TranslationKey; values?: TranslationValues };

type CreatePostFormProps = {
  /** Closes the dialog after the post is created. */
  onCreated: () => void;
  /** Tells the dialog whether closing must wait (while the post itself is being created). */
  onCloseLockChange: (locked: boolean) => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

const FILE_ERROR_ID = "create-post-file-error";
const CAPTION_ID = "create-post-caption";
const CAPTION_COUNTER_ID = "create-post-caption-counter";
const CAPTION_ERROR_ID = "create-post-caption-error";

/**
 * Creating a post (FR-POST-01 to FR-POST-03), in two API calls (ADR-007):
 * upload the file with progress, then create the post from its storage path.
 *
 * Files are checked against the API's limits as soon as they are picked. On
 * failure, the file and caption stay so the user can retry. If only creating the
 * post failed, the retry reuses the uploaded file. This component unmounts when
 * the dialog closes, which cancels an upload in progress.
 */
export function CreatePostForm({ onCreated, onCloseLockChange }: CreatePostFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const createPost = useCreatePost();

  const [selected, setSelected] = useState<SelectedMedia | null>(null);
  const [fileError, setFileError] = useState<FileError | null>(null);
  const [submitError, setSubmitError] = useState<CreatePostError | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const uploadedRef = useRef<UploadedMedia | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The preview URL to release on unmount; kept in a ref so the cleanup sees the latest one.
  const previewUrlRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CaptionFormValues, unknown, CaptionFormValues>({
    resolver: zodResolver(captionFormSchema),
    mode: "onChange",
    defaultValues: { caption: "" },
  });
  const caption = useWatch({ control, name: "caption" });

  // Closing the dialog unmounts this form: cancel an upload still in progress and
  // release the preview's blob URL so the browser can free the file's memory.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  // The post can't be "un-created" by closing, so the dialog waits for that step.
  useEffect(() => {
    onCloseLockChange(phase === "creating");
    return () => onCloseLockChange(false);
  }, [phase, onCloseLockChange]);

  function selectFile(file: File | null) {
    setSubmitError(null);
    if (!file) {
      setFileError({ key: "createPost.errors.oneFile" });
      return;
    }
    const result = validateMediaFile(file);
    if (!result.ok) {
      // A rejected file leaves the previous valid choice in place.
      setFileError({
        key: `createPost.errors.${result.error}`,
        values: {
          size: formatFileSize(file.size, locale),
          max: result.maxBytes ? formatFileSize(result.maxBytes, locale) : "",
        },
      });
      return;
    }
    setFileError(null);
    // Created here rather than in an effect, and revoked when replaced or on unmount.
    if (selected) URL.revokeObjectURL(selected.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setSelected({ file, mediaType: result.mediaType, previewUrl });
  }

  const changeFilePicker = useFilePicker(selectFile);

  async function uploadSelected(file: File): Promise<string | null> {
    if (uploadedRef.current?.file === file) return uploadedRef.current.path;

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("uploading");
    setProgress(0);
    try {
      const upload = await uploadFile({
        file,
        purpose: "post",
        signal: controller.signal,
        onProgress: setProgress,
      });
      uploadedRef.current = { file, path: upload.path };
      return upload.path;
    } catch (error) {
      setPhase("idle");
      if (isAbortError(error)) toast.info(t("createPost.uploadCancelled"));
      else if (!isSessionExpiredError(error)) setSubmitError(mapCreatePostError(error, "upload"));
      return null;
    } finally {
      abortRef.current = null;
    }
  }

  async function publish({ caption: cleanCaption }: CaptionFormValues) {
    if (phase !== "idle") return;
    if (!selected) {
      setFileError({ key: "createPost.errors.noFile" });
      return;
    }
    setSubmitError(null);

    const mediaPath = await uploadSelected(selected.file);
    if (!mediaPath) return;

    setPhase("creating");
    try {
      const post = await createPost.mutateAsync({ caption: cleanCaption, mediaPath });
      toast.success(t("createPost.success"), {
        action: { label: t("createPost.view"), onClick: () => router.push(postHref(post.id)) },
      });
      onCreated();
    } catch (error) {
      setPhase("idle");
      if (!isSessionExpiredError(error)) setSubmitError(mapCreatePostError(error, "create"));
    }
  }

  const isBusy = phase !== "idle";
  const captionErrorKey = errors.caption?.message as TranslationKey | undefined;
  const percent = Math.round(progress * 100);

  return (
    <form
      noValidate
      // handleSubmit validates the caption first, then calls publish.
      onSubmit={(event) => void handleSubmit(publish)(event)}
      className="flex min-w-0 flex-col gap-4"
    >
      {submitError ? (
        <FormErrorAlert message={t(submitError.key)} details={submitError.details} />
      ) : null}

      <div className="flex flex-col gap-2">
        {selected ? (
          <>
            <MediaPreview url={selected.previewUrl} mediaType={selected.mediaType} />
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs text-muted-foreground">
                {selected.file.name} · {formatFileSize(selected.file.size, locale)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                aria-describedby={fileError ? FILE_ERROR_ID : undefined}
                onClick={changeFilePicker.open}
              >
                <RefreshCwIcon aria-hidden="true" />
                {t("createPost.changeFile")}
              </Button>
              {changeFilePicker.input}
            </div>
          </>
        ) : (
          <MediaDropzone
            onFile={selectFile}
            disabled={isBusy}
            describedBy={fileError ? FILE_ERROR_ID : undefined}
          />
        )}
        {fileError ? (
          <p id={FILE_ERROR_ID} role="alert" className="text-sm text-destructive">
            {t(fileError.key, fileError.values)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={CAPTION_ID}>{t("createPost.captionLabel")}</Label>
        <Textarea
          id={CAPTION_ID}
          rows={3}
          placeholder={t("createPost.captionPlaceholder")}
          disabled={isBusy}
          aria-invalid={Boolean(captionErrorKey)}
          aria-describedby={[captionErrorKey ? CAPTION_ERROR_ID : null, CAPTION_COUNTER_ID]
            .filter(Boolean)
            .join(" ")}
          className="max-h-48"
          {...register("caption")}
        />
        {captionErrorKey ? (
          <p id={CAPTION_ERROR_ID} className="text-sm text-destructive">
            {t(captionErrorKey, { max: CAPTION_MAX_LENGTH })}
          </p>
        ) : null}
        <CharacterCounter
          id={CAPTION_COUNTER_ID}
          count={caption.length}
          max={CAPTION_MAX_LENGTH}
          className="self-end"
        />
      </div>

      {phase === "uploading" ? (
        <div className="flex flex-col gap-1.5">
          <Progress value={percent} aria-label={t("createPost.uploadProgress")} />
          <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            {t("createPost.uploading", { percent })}
          </p>
        </div>
      ) : null}

      <DialogFooter>
        {phase === "uploading" ? (
          <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()}>
            {t("createPost.cancelUpload")}
          </Button>
        ) : (
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={phase === "creating"}>
              {t("common.cancel")}
            </Button>
          </DialogClose>
        )}
        <Button type="submit" loading={isBusy}>
          {t("createPost.submit")}
        </Button>
      </DialogFooter>
    </form>
  );
}
