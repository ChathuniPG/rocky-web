"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

/** Avatar sizes in the design scale. */
export type UserAvatarSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<UserAvatarSize, { root: string; fallback: string }> = {
  sm: { root: "size-8", fallback: "text-xs" },
  md: { root: "size-10", fallback: "text-sm" },
  lg: { root: "size-16", fallback: "text-lg" },
  xl: { root: "size-24", fallback: "text-2xl" },
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

/** A user's profile picture, falling back to their initials on a tinted circle. */
export function UserAvatar({ name, src, size = "md", className }: UserAvatarProps) {
  const t = useTranslations();
  const alt = t("avatar.alt", { name });
  const classes = sizeClasses[size];

  return (
    <Avatar className={cn(classes.root, className)}>
      {src ? <AvatarImage src={src} alt={alt} loading="lazy" /> : null}
      <AvatarFallback
        role="img"
        aria-label={alt}
        className={cn("bg-secondary font-semibold text-secondary-foreground", classes.fallback)}
      >
        <span aria-hidden="true">{getInitials(name)}</span>
      </AvatarFallback>
    </Avatar>
  );
}
