import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { MarkAllReadButton } from "@/features/notifications/mark-all-read-button";
import { NotificationList } from "@/features/notifications/notification-list";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.notifications.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * Notifications, newest first, with "Mark all as read" (FR-NOTF-02..03). A
 * server component; the list and the button load their data in the browser.
 */
export default function NotificationsPage() {
  return (
    <>
      <PageHeader title={t("pages.notifications.title")} actions={<MarkAllReadButton />} />
      <NotificationList />
    </>
  );
}
