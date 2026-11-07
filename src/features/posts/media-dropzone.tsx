"use client";

import { ImageUpIcon } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { MEDIA_ACCEPT } from "./media-validation";

type MediaDropzoneProps = {
  /** Called with the picked or dropped file, or `null` when several were dropped. */
  onFile: (file: File | null) => void;
  /** Id of the element describing the current error, linked to the button. */
  describedBy?: string;
  disabled?: boolean;
};

/**
 * Where the user adds a photo or video (FR-POST-01): drag and drop a file, or
 * use the button to open the file picker. The button is the keyboard and
 * screen-reader path; dropping is a shortcut for mouse users.
 */
export function MediaDropzone({ onFile, describedBy, disabled = false }: MediaDropzoneProps) {
  const t = useTranslations();
  const picker = useFilePicker(onFile);
  const [isDragging, setIsDragging] = useState(false);

  function onDragOver(event: DragEvent<HTMLDivElement>) {
    // Without preventDefault the browser refuses the drop (and would open the file instead).
    event.preventDefault();
    if (disabled) return;
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>) {
    // Moving over a child element also fires dragleave; only react when leaving the zone.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setIsDragging(false);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const { files } = event.dataTransfer;
    if (files.length === 0) return;
    onFile(files.length === 1 ? (files[0] ?? null) : null);
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-dragging={isDragging || undefined}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        "data-dragging:border-primary data-dragging:bg-secondary",
        disabled && "opacity-50",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <ImageUpIcon aria-hidden="true" className="size-6" />
      </div>
      <p className="text-sm font-medium">
        {isDragging ? t("createPost.dropzone.dropHere") : t("createPost.dropzone.prompt")}
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        aria-describedby={describedBy}
        onClick={picker.open}
      >
        {t("createPost.dropzone.choose")}
      </Button>
      <p className="text-xs text-muted-foreground">{t("createPost.dropzone.hint")}</p>
      {picker.input}
    </div>
  );
}

/**
 * A hidden file input limited to post media, plus a function that opens it.
 * Render `input` anywhere in the component and call `open` from a button.
 */
export function useFilePicker(onFile: (file: File) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  const input = (
    <input
      ref={inputRef}
      type="file"
      accept={MEDIA_ACCEPT}
      tabIndex={-1}
      aria-hidden="true"
      className="hidden"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) onFile(file);
      }}
    />
  );

  return { input, open: () => inputRef.current?.click() };
}
