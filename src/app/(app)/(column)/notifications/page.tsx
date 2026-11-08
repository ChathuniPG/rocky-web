import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { MarkAllReadButton } from "@/features/notifications/mark-all-read-button";
import { NotificationList } from "@/features/notifications/notification-list";
import { DocumentTitle } from "@/i18n/document-title";
import { getTranslations } from "@/i18n/server";
import { TranslatedText } from "@/i18n/translated-text";

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
      <DocumentTitle id="pages.notifications.title" />
      <PageHeader
        title={<TranslatedText id="pages.notifications.title" />}
        actions={<MarkAllReadButton />}
      />
      <NotificationList />
    </>
  );
}
