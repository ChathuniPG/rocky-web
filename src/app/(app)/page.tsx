import { HouseIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.home.title") };

/** Home feed (FR-FEED-01). Placeholder until the feed issue. */
export default function HomePage() {
  return (
    <>
      <PageHeader title={t("pages.home.title")} />
      <EmptyState
        icon={HouseIcon}
        title={t("pages.home.emptyTitle")}
        description={t("pages.home.emptyDescription")}
      />
    </>
  );
}
