"use client";

import Image from "next/image";

import { useTranslations } from "@/i18n/i18n-provider";
import type { MediaType } from "@/lib/api/types";

type MediaPreviewProps = {
  /** A local blob URL for the selected file; the caller creates and revokes it. */
  url: string;
  mediaType: MediaType;
};

/**
 * Shows the selected photo or video before it is posted, from a temporary
 * blob URL of the local file.
 */
export function MediaPreview({ url, mediaType }: MediaPreviewProps) {
  const t = useTranslations();

  return (
    <div className="relative aspect-4/5 max-h-[45dvh] w-full overflow-hidden rounded-lg bg-muted">
      {mediaType === "VIDEO" ? (
        <video
          src={url}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={t("createPost.previewVideoLabel")}
          className="absolute inset-0 size-full bg-black object-contain"
        />
      ) : (
        // `unoptimized`: a local blob URL can't (and needn't) go through the image optimizer.
        <Image
          src={url}
          alt={t("createPost.previewImageAlt")}
          fill
          unoptimized
          className="object-contain"
        />
      )}
    </div>
  );
}
