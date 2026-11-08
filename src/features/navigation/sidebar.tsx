"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useMemo, type ReactNode } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { useUnreadNotificationCount } from "@/features/notifications/use-unread-notification-count";
import { CreatePostDialog } from "@/features/posts/create-post-dialog";
import { useTranslations } from "@/i18n/i18n-provider";

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

/**
 * Left navigation (design.md 7.2): icons with tooltips below 1280px, icons with
 * labels from 1280px, and the unread notification badge (FR-NOTF-04). The nav
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

  return (
    <aside className="sticky top-0 flex h-dvh w-19 shrink-0 flex-col border-r px-3 py-4 xl:w-64">
      <Link
        href="/"
        aria-label={t("common.appName")}
        className="mb-6 flex h-12 items-center justify-center gap-3 rounded-xl px-3 outline-none focus-visible:ring-3 focus-visible:ring-ring xl:justify-start"
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-black text-primary-foreground"
        >
          R
        </span>
        <span aria-hidden="true" className="hidden text-xl font-extrabold tracking-tight xl:inline">
          {t("common.appName")}
        </span>
      </Link>

      <nav aria-label={t("nav.mainNavigation")} className="flex-1">
        <Suspense
          fallback={
            <NavList
              items={navItems}
              pathname={null}
              unreadNotificationCount={unreadNotificationCount}
            />
          }
        >
          <NavListForCurrentPath
            items={navItems}
            unreadNotificationCount={unreadNotificationCount}
          />
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
  unreadNotificationCount,
}: {
  items: readonly NavItem[];
  unreadNotificationCount: number;
}) {
  const pathname = usePathname();
  return (
    <NavList items={items} pathname={pathname} unreadNotificationCount={unreadNotificationCount} />
  );
}

function NavList({
  items,
  pathname,
  unreadNotificationCount,
}: {
  items: readonly NavItem[];
  pathname: string | null;
  unreadNotificationCount: number;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <NavEntry
            item={item}
            pathname={pathname}
            unreadNotificationCount={unreadNotificationCount}
          />
        </li>
      ))}
    </ul>
  );
}

function NavEntry({
  item,
  pathname,
  unreadNotificationCount,
}: {
  item: NavItem;
  pathname: string | null;
  unreadNotificationCount: number;
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

  const badgeCount = item.id === "notifications" ? unreadNotificationCount : 0;

  return (
    <CollapsedTooltip label={label}>
      <Link
        href={item.href}
        aria-current={isNavItemActive(item.href, pathname) ? "page" : undefined}
        className={navEntryClasses}
      >
        <span className="relative">
          <Icon aria-hidden="true" />
          {badgeCount > 0 ? <UnreadBadge count={badgeCount} /> : null}
        </span>
        <span className={navLabelClasses}>{label}</span>
      </Link>
    </CollapsedTooltip>
  );
}

function UnreadBadge({ count }: { count: number }) {
  const t = useTranslations();
  return (
    <>
      <Badge
        variant="highlight"
        aria-hidden="true"
        className="absolute -top-1.5 -right-2 h-4.5 min-w-4.5 px-1 text-[0.65rem] ring-2 ring-background"
      >
        {count > 99 ? "99+" : count}
      </Badge>
      <span className="sr-only">{t("nav.unreadNotifications", { count })}</span>
    </>
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
