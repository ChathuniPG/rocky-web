"use client";

import Image from "next/image";

import { useTranslations } from "@/i18n/i18n-provider";
import type { Post } from "@/lib/api/types";
import { cn } from "@/lib/utils";

// The content column is at most 672px wide (max-w-2xl) minus the card padding;
// below that the card spans the viewport. Lets next/image pick a fitting size.
const IMAGE_SIZES = "(min-width: 704px) 640px, 100vw";

type PostMediaProps = {
  post: Pick<Post, "mediaUrl" | "mediaType" | "author">;
  /** Load the image right away, for the first post on screen (largest contentful paint). */
  eager?: boolean;
  className?: string;
};

/**
 * A post's single media item (A-02). Images go through next/image (resized and
 * lazy-loaded, NFR-PERF-03; next.config.ts only allows our Storage bucket).
 * Videos use the native player (A-03), muted so they never play sound unasked,
 * and only fetch their metadata until played.
 */
export function PostMedia({ post, eager = false, className }: PostMediaProps) {
  const t = useTranslations();
  const name = post.author.displayName;

  return (
    <div
      className={cn("relative aspect-4/5 w-full overflow-hidden rounded-lg bg-muted", className)}
    >
      {post.mediaType === "VIDEO" ? (
        <video
          src={post.mediaUrl}
          controls
          preload="metadata"
          playsInline
          muted
          aria-label={t("post.videoLabel", { name })}
          className="absolute inset-0 size-full bg-black object-contain"
        />
      ) : (
        <Image
          src={post.mediaUrl}
          alt={t("post.imageAlt", { name })}
          fill
          sizes={IMAGE_SIZES}
          // Next 16 recommends loading/fetchPriority over the `preload` prop when several
          // images could be the LCP element, as in a feed.
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          className="object-contain"
        />
      )}
    </div>
  );
}
