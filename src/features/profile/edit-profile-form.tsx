"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUpIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { CharacterCounter } from "@/components/character-counter";
import { FormErrorAlert } from "@/components/form-error-alert";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { useLocale, useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";
import { isSessionExpiredError } from "@/lib/api/errors";
import type { Profile } from "@/lib/api/types";
import { uploadFile } from "@/lib/api/upload";
import { formatFileSize } from "@/lib/format/file-size";

import { AVATAR_ACCEPT, MAX_AVATAR_BYTES, validateAvatarFile } from "./avatar-validation";
import { mapEditProfileError, type EditProfileError } from "./map-edit-profile-error";
import {
  BIO_MAX_LENGTH,
  buildProfileUpdate,
  DISPLAY_NAME_MAX_LENGTH,
  profileFormDefaults,
  profileFormSchema,
  type AvatarChange,
  type ProfileFormValues,
} from "./profile-schema";
import { useUpdateProfile } from "./use-update-profile";

/** Where a save is: idle, uploading the new avatar, or saving the profile. */
type Phase = "idle" | "uploading" | "saving";

/** The avatar as edited: unchanged, removed, or a new file with a temporary preview URL. */
type AvatarDraft =
  { kind: "current" } | { kind: "removed" } | { kind: "new"; file: File; previewUrl: string };

type EditProfileFormProps = {
  profile: Profile;
  /** Closes the dialog after saving. */
  onSaved: () => void;
  /** Tells the dialog whether closing must wait (while the profile itself is being saved). */
  onCloseLockChange: (locked: boolean) => void;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

const ids = {
  displayName: "edit-profile-display-name",
  displayNameError: "edit-profile-display-name-error",
  displayNameCounter: "edit-profile-display-name-counter",
  bio: "edit-profile-bio",
  bioError: "edit-profile-bio-error",
  bioCounter: "edit-profile-bio-counter",
  avatarHint: "edit-profile-avatar-hint",
  avatarError: "edit-profile-avatar-error",
};

const describedBy = (...values: (string | false | undefined)[]) =>
  values.filter(Boolean).join(" ") || undefined;

/**
 * Editing your own profile (FR-PROF-04): display name (1–50), bio (up to 160,
 * may be cleared) and avatar. A new avatar is checked when picked, previewed,
 * and uploaded on Save with progress (purpose "avatar", ADR-007); then PATCH
 * /users/me sends only what changed. On failure everything stays so the user
 * can retry, and a finished upload is reused.
 */
export function EditProfileForm({ profile, onSaved, onCloseLockChange }: EditProfileFormProps) {
  const t = useTranslations();
  const locale = useLocale();
  const updateProfile = useUpdateProfile();

  const [avatar, setAvatar] = useState<AvatarDraft>({ kind: "current" });
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<EditProfileError | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const uploadedRef = useRef<{ file: File; path: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // The preview URL to release on unmount; a ref so the cleanup sees the latest one.
  const previewUrlRef = useRef<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
    defaultValues: profileFormDefaults(profile),
  });
  const displayName = useWatch({ control, name: "displayName" });
  const bio = useWatch({ control, name: "bio" });

  // Closing the dialog unmounts this form: cancel an upload in progress and free the preview.
  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  // The profile can't be "un-saved" by closing, so the dialog waits for that step.
  useEffect(() => {
    onCloseLockChange(phase === "saving");
    return () => onCloseLockChange(false);
  }, [phase, onCloseLockChange]);

  function replaceAvatarDraft(next: AvatarDraft) {
    if (avatar.kind === "new") URL.revokeObjectURL(avatar.previewUrl);
    previewUrlRef.current = next.kind === "new" ? next.previewUrl : null;
    setAvatar(next);
  }

  function selectAvatar(file: File) {
    setSubmitError(null);
    const result = validateAvatarFile(file);
    if (!result.ok) {
      // A rejected file leaves the previous choice in place.
      setAvatarError(
        t(`profile.edit.errors.${result.error}`, {
          size: formatFileSize(file.size, locale),
          max: formatFileSize(MAX_AVATAR_BYTES, locale),
        }),
      );
      return;
    }
    setAvatarError(null);
    replaceAvatarDraft({ kind: "new", file, previewUrl: URL.createObjectURL(file) });
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    if (uploadedRef.current?.file === file) return uploadedRef.current.path;

    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("uploading");
    setProgress(0);
    try {
      const upload = await uploadFile({
        file,
        purpose: "avatar",
        signal: controller.signal,
        onProgress: setProgress,
      });
      uploadedRef.current = { file, path: upload.path };
      return upload.path;
    } catch (error) {
      setPhase("idle");
      if (isAbortError(error)) toast.info(t("profile.edit.uploadCancelled"));
      else if (!isSessionExpiredError(error)) setSubmitError(mapEditProfileError(error, "upload"));
      return null;
    } finally {
      abortRef.current = null;
    }
  }

  async function save(values: ProfileFormValues) {
    if (phase !== "idle") return;
    setSubmitError(null);

    let avatarChange: AvatarChange = { kind: "keep" };
    if (avatar.kind === "removed") avatarChange = { kind: "remove" };
    if (avatar.kind === "new") {
      const path = await uploadAvatar(avatar.file);
      if (!path) return;
      avatarChange = { kind: "replace", path };
    }

    const body = buildProfileUpdate(profile, values, avatarChange);
    if (!body) {
      // Nothing changed: the API rejects an empty update, and there is nothing to confirm.
      onSaved();
      return;
    }

    setPhase("saving");
    try {
      await updateProfile.mutateAsync(body);
      toast.success(t("profile.edit.success"));
      onSaved();
    } catch (error) {
      setPhase("idle");
      if (!isSessionExpiredError(error)) setSubmitError(mapEditProfileError(error, "save"));
    }
  }

  const isBusy = phase !== "idle";
  const percent = Math.round(progress * 100);
  const displayNameErrorKey = errors.displayName?.message as TranslationKey | undefined;
  const bioErrorKey = errors.bio?.message as TranslationKey | undefined;
  const previewSrc =
    avatar.kind === "new"
      ? avatar.previewUrl
      : avatar.kind === "removed"
        ? null
        : profile.avatarUrl;
  const hasAvatar = previewSrc !== null;

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(save)(event)}
      className="flex min-w-0 flex-col gap-5"
    >
      {submitError ? (
        <FormErrorAlert message={t(submitError.key)} details={submitError.details} />
      ) : null}

      <fieldset className="flex flex-col gap-3" disabled={isBusy}>
        <legend className="mb-2 text-sm font-medium">{t("profile.edit.avatar")}</legend>
        <div className="flex items-center gap-4">
          {/* The preview follows the draft: the new file, initials once removed, or the current picture. */}
          <UserAvatar name={displayName || profile.displayName} src={previewSrc} size="xl" />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-describedby={describedBy(
                ids.avatarHint,
                avatarError !== null && ids.avatarError,
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUpIcon aria-hidden="true" />
              {t(hasAvatar ? "profile.edit.changeAvatar" : "profile.edit.uploadAvatar")}
            </Button>
            {hasAvatar ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAvatarError(null);
                  replaceAvatarDraft({ kind: "removed" });
                }}
              >
                <Trash2Icon aria-hidden="true" />
                {t("profile.edit.removeAvatar")}
              </Button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={AVATAR_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Cleared so picking the same file again still fires a change.
              event.target.value = "";
              if (file) selectAvatar(file);
            }}
          />
        </div>
        <p id={ids.avatarHint} className="text-xs text-muted-foreground">
          {t("profile.edit.avatarHint")}
        </p>
        {avatarError ? (
          <p id={ids.avatarError} role="alert" className="text-sm text-destructive">
            {avatarError}
          </p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.displayName}>{t("profile.edit.displayName")}</Label>
        <Input
          id={ids.displayName}
          autoComplete="name"
          disabled={isBusy}
          aria-invalid={Boolean(displayNameErrorKey)}
          aria-describedby={describedBy(
            displayNameErrorKey && ids.displayNameError,
            ids.displayNameCounter,
          )}
          className="h-10"
          {...register("displayName")}
        />
        {displayNameErrorKey ? (
          <p id={ids.displayNameError} className="text-sm text-destructive">
            {t(displayNameErrorKey, { max: DISPLAY_NAME_MAX_LENGTH })}
          </p>
        ) : null}
        <CharacterCounter
          id={ids.displayNameCounter}
          count={displayName.length}
          max={DISPLAY_NAME_MAX_LENGTH}
          className="self-end"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.bio}>{t("profile.edit.bio")}</Label>
        <Textarea
          id={ids.bio}
          rows={3}
          placeholder={t("profile.edit.bioPlaceholder")}
          disabled={isBusy}
          aria-invalid={Boolean(bioErrorKey)}
          aria-describedby={describedBy(bioErrorKey && ids.bioError, ids.bioCounter)}
          className="max-h-40"
          {...register("bio")}
        />
        {bioErrorKey ? (
          <p id={ids.bioError} className="text-sm text-destructive">
            {t(bioErrorKey, { max: BIO_MAX_LENGTH })}
          </p>
        ) : null}
        <CharacterCounter
          id={ids.bioCounter}
          count={bio.length}
          max={BIO_MAX_LENGTH}
          className="self-end"
        />
      </div>

      {phase === "uploading" ? (
        <div className="flex flex-col gap-1.5">
          <Progress value={percent} aria-label={t("profile.edit.uploadProgress")} />
          <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
            {t("profile.edit.uploading", { percent })}
          </p>
        </div>
      ) : null}

      <DialogFooter>
        {phase === "uploading" ? (
          <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()}>
            {t("profile.edit.cancelUpload")}
          </Button>
        ) : (
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={phase === "saving"}>
              {t("common.cancel")}
            </Button>
          </DialogClose>
        )}
        <Button type="submit" loading={isBusy}>
          {t("profile.edit.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
