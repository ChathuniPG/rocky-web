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

/** URL of a user's profile page. */
export function profileHref(username: string): string {
  return `/u/${encodeURIComponent(username)}`;
}

/**
 * Sidebar entries in display order (FR-UI-01, design.md 7.1). The Profile entry
 * points at the signed-in user's own profile.
 */
export function getNavItems(currentUsername: string): readonly NavItem[] {
  return [
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
      href: profileHref(currentUsername),
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
}

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
