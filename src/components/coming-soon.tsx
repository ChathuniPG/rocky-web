import { ConstructionIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getTranslations } from "@/i18n/server";

/**
 * Body for routes whose feature hasn't been built yet, so navigation works
 * end to end in the meantime.
 */
export function ComingSoon({ title }: { title?: string }) {
  const t = getTranslations();
  return (
    <EmptyState
      icon={ConstructionIcon}
      title={title ?? t("common.comingSoon")}
      description={t("common.underConstruction")}
    />
  );
}
