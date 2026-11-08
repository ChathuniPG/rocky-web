"use client";

import Image from "next/image";
import { useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/** Avatar sizes in the design scale. */
export type UserAvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<UserAvatarSize, { root: string; fallback: string; sizes: string }> = {
  sm: { root: "size-8", fallback: "text-xs", sizes: "32px" },
  // md also covers the feed's 44px avatar: next/image then picks 48w (or 96w at 2x).
  md: { root: "size-10", fallback: "text-sm", sizes: "44px" },
  lg: { root: "size-16", fallback: "text-lg", sizes: "64px" },
  xl: { root: "size-24", fallback: "text-2xl", sizes: "96px" },
};

/**
 * Up to two initials from a display name ("Ada Lovelace" → "AL"). Uses
 * `Array.from` so characters outside the Basic Multilingual Plane aren't split in half.
 */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return "?";
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  const initials = [first, last].map((word) => (word ? (Array.from(word)[0] ?? "") : ""));
  return initials.join("").toUpperCase();
}

type UserAvatarProps = {
  /** Display name, used for the alt text and the initials fallback. */
  name: string;
  /** Avatar URL; when missing or failing to load, initials are shown. */
  src?: string | null;
  size?: UserAvatarSize;
  className?: string;
};

/**
 * A user's profile picture, falling back to their initials on a tinted circle.
 *
 * The picture goes through next/image, resized to the avatar's size, instead of
 * downloading the original upload (NFR-PERF-03). It is drawn over the initials,
 * which show while it loads and if it fails; screen readers get one name either way.
 */
export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const t = useTranslations();
  const alt = t("avatar.alt", { name });
  const classes = sizeClasses[size];
  // Remembers which URL failed, so a new URL (e.g. after an upload) is tried again.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <Avatar className={cn(classes.root, className)}>
      <AvatarFallback
        role={showImage ? undefined : "img"}
        aria-label={showImage ? undefined : alt}
        aria-hidden={showImage || undefined}
        className={cn("bg-secondary font-semibold text-secondary-foreground", classes.fallback)}
      >
        <span aria-hidden="true">{getInitials(name)}</span>
      </AvatarFallback>
      {showImage && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={classes.sizes}
          className="rounded-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : null}
    </Avatar>
  );
}
