"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useMemo, type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { useUnreadConversationCount } from "@/features/messages/use-unread-conversation-count";
import { useUnreadNotificationCount } from "@/features/notifications/use-unread-notification-count";
import { CreatePostDialog } from "@/features/posts/create-post-dialog";
import { useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";

import { getNavItems, isNavItemActive, type NavItem } from "./nav-items";

// Shared by links and the Post button so every entry has the same hover, press,
// focus and active states (FR-UI-02). Purple marks the current page (design.md 7.4).
const navEntryClasses = [
  "relative flex h-12 w-full items-center justify-center gap-4 rounded-xl px-3 text-base text-foreground outline-none transition-colors xl:justify-start",
  "hover:bg-accent active:bg-[color-mix(in_oklab,var(--accent),var(--foreground)_6%)]",
  "focus-visible:ring-3 focus-visible:ring-ring",
  "aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-primary",
  "[&_svg]:size-6 [&_svg]:shrink-0",
].join(" ");

// Visible from xl (1280px); below that it stays in the accessibility tree, so
// icon-only entries still have a name.
const navLabelClasses = "sr-only xl:not-sr-only xl:truncate";

/** Unread counts shown as badges on their nav entries. */
type UnreadCounts = { notifications: number; messages: number };

/**
 * Left navigation (design.md 7.2): icons with tooltips below 1280px, icons with
 * labels from 1280px, and the unread badges on Notifications (FR-NOTF-04) and
 * Messages (FR-MSG-06). The nav
 * list sits in Suspense because `usePathname` suspends while prerendering
 * routes with unknown dynamic params under cacheComponents; the fallback is the
 * same list without the active highlight. Rendered inside the AuthGate, so the
 * signed-in user is always known.
 */
export function Sidebar() {
  const t = useTranslations();
  const { username } = useCurrentUser();
  const navItems = useMemo(() => getNavItems(username), [username]);
  const unreadNotificationCount = useUnreadNotificationCount().data?.count ?? 0;
  const unreadConversationCount = useUnreadConversationCount().data?.count ?? 0;
  const unreadCounts = useMemo<UnreadCounts>(
    () => ({ notifications: unreadNotificationCount, messages: unreadConversationCount }),
    [unreadNotificationCount, unreadConversationCount],
  );

  return (
    // Scrolls on its own when the viewport is short (e.g. 200–400 % zoom), so every
    // entry stays reachable (WCAG 1.4.4, 1.4.10). The padding keeps focus rings
    // inside the scroll box, which would otherwise clip them.
    <aside className="sticky top-0 flex h-dvh w-19 shrink-0 flex-col overflow-y-auto overscroll-contain border-r px-3 py-4 xl:w-64">
      {/* The link's name is its text (sr-only below 1280px), not an aria-label, so the
          name matches what is shown (WCAG 2.5.3). */}
      <Link
        href="/"
        className="mb-6 flex h-12 shrink-0 items-center justify-center gap-3 rounded-xl px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring xl:justify-start"
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-black text-primary-foreground"
        >
          R
        </span>
        <span className="sr-only text-xl font-extrabold tracking-tight xl:not-sr-only">
          {t("common.appName")}
        </span>
      </Link>

      <nav aria-label={t("nav.mainNavigation")} className="flex-1">
        <Suspense
          fallback={<NavList items={navItems} pathname={null} unreadCounts={unreadCounts} />}
        >
          <NavListForCurrentPath items={navItems} unreadCounts={unreadCounts} />
        </Suspense>
      </nav>

      <div className="flex justify-center xl:justify-start xl:px-1.5">
        <ThemeToggle side="right" />
      </div>
    </aside>
  );
}

function NavListForCurrentPath({
  items,
  unreadCounts,
}: {
  items: readonly NavItem[];
  unreadCounts: UnreadCounts;
}) {
  const pathname = usePathname();
  return <NavList items={items} pathname={pathname} unreadCounts={unreadCounts} />;
}

function NavList({
  items,
  pathname,
  unreadCounts,
}: {
  items: readonly NavItem[];
  pathname: string | null;
  unreadCounts: UnreadCounts;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <NavEntry item={item} pathname={pathname} unreadCounts={unreadCounts} />
        </li>
      ))}
    </ul>
  );
}

function NavEntry({
  item,
  pathname,
  unreadCounts,
}: {
  item: NavItem;
  pathname: string | null;
  unreadCounts: UnreadCounts;
}) {
  const t = useTranslations();
  const label = t(item.labelKey);
  const Icon = item.icon;

  if (item.kind === "create-post") {
    // Post opens a dialog instead of navigating (design.md 7.1).
    return (
      <CreatePostDialog>
        <CollapsedTooltip label={label}>
          <DialogTrigger className={navEntryClasses}>
            <Icon aria-hidden="true" />
            <span className={navLabelClasses}>{label}</span>
          </DialogTrigger>
        </CollapsedTooltip>
      </CreatePostDialog>
    );
  }

  const badge = unreadBadgeFor(item.id, unreadCounts);

  return (
    <CollapsedTooltip label={label}>
      <Link
        href={item.href}
        aria-current={isNavItemActive(item.href, pathname) ? "page" : undefined}
        className={navEntryClasses}
      >
        <span className="relative">
          <Icon aria-hidden="true" />
          {badge ? <UnreadBadgeNumber count={badge.count} /> : null}
        </span>
        <span className={navLabelClasses}>{label}</span>
        {/* After the label, so the link's name reads "Messages, Unread conversations: 3". */}
        {badge ? (
          <span className="sr-only">{t(badge.labelKey, { count: badge.count })}</span>
        ) : null}
      </Link>
    </CollapsedTooltip>
  );
}

/** The badge for an entry with unread items, or null when there are none. */
function unreadBadgeFor(
  id: NavItem["id"],
  counts: UnreadCounts,
): { count: number; labelKey: TranslationKey } | null {
  if (id === "notifications" && counts.notifications > 0) {
    return { count: counts.notifications, labelKey: "nav.unreadNotifications" };
  }
  if (id === "messages" && counts.messages > 0) {
    return { count: counts.messages, labelKey: "nav.unreadMessages" };
  }
  return null;
}

// The visible number, so the count isn't conveyed by colour alone; screen
// readers get the full text from the link's sr-only span instead.
function UnreadBadgeNumber({ count }: { count: number }) {
  return (
    <Badge
      variant="highlight"
      aria-hidden="true"
      className="absolute -top-1.5 -right-2 h-4.5 min-w-4.5 px-1 text-[0.65rem] ring-2 ring-background"
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

/** Tooltip naming an entry while the sidebar is icon-only; hidden once labels show. */
function CollapsedTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8} className="xl:hidden">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
