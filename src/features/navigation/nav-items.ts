import {
  BellIcon,
  HouseIcon,
  MessageCircleIcon,
  SearchIcon,
  SettingsIcon,
  SquarePlusIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react";

import type { TranslationKey } from "@/i18n/translate";

/** A sidebar entry that navigates to a route. */
export type NavLinkItem = {
  kind: "link";
  id: "home" | "search" | "notifications" | "messages" | "profile" | "settings";
  href: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
};

/** The sidebar's "Post" entry, which opens the create-post dialog instead of navigating. */
export type NavCreatePostItem = {
  kind: "create-post";
  id: "post";
  labelKey: TranslationKey;
  icon: LucideIcon;
};

/** Any sidebar entry. */
export type NavItem = NavLinkItem | NavCreatePostItem;

/**
 * Placeholder profile link until the signed-in user is known. "me" can never be
 * a real username (FR-AUTH-02 requires at least 3 characters), so it can't collide.
 */
const PROFILE_PLACEHOLDER_HREF = "/u/me";

/** Sidebar entries in display order (FR-UI-01, design.md 7.1). */
export const navItems: readonly NavItem[] = [
  { kind: "link", id: "home", href: "/", labelKey: "nav.home", icon: HouseIcon },
  { kind: "link", id: "search", href: "/search", labelKey: "nav.search", icon: SearchIcon },
  { kind: "create-post", id: "post", labelKey: "nav.post", icon: SquarePlusIcon },
  {
    kind: "link",
    id: "notifications",
    href: "/notifications",
    labelKey: "nav.notifications",
    icon: BellIcon,
  },
  {
    kind: "link",
    id: "messages",
    href: "/messages",
    labelKey: "nav.messages",
    icon: MessageCircleIcon,
  },
  {
    kind: "link",
    id: "profile",
    href: PROFILE_PLACEHOLDER_HREF,
    labelKey: "nav.profile",
    icon: UserIcon,
  },
  {
    kind: "link",
    id: "settings",
    href: "/settings",
    labelKey: "nav.settings",
    icon: SettingsIcon,
  },
];

/**
 * Whether a nav link matches the current path. Home only matches exactly;
 * others also match their sub-routes (e.g. /messages/123 keeps Messages active).
 * `null` means the path isn't known yet (while prerendering), so nothing is active.
 */
export function isNavItemActive(href: string, pathname: string | null): boolean {
  if (pathname === null) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
