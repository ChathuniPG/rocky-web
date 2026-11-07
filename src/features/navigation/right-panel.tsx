import { UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { getTranslations } from "@/i18n/server";

/**
 * Right-hand column on widescreens (design.md 7.2), shown from 1536px. Will list
 * suggested users; a placeholder for now.
 */
export function RightPanel() {
  const t = getTranslations();

  return (
    <aside
      aria-label={t("rightPanel.suggestedTitle")}
      className="sticky top-0 hidden h-dvh w-80 shrink-0 flex-col gap-4 border-l px-6 py-6 2xl:flex"
    >
      <h2 className="text-base font-semibold">{t("rightPanel.suggestedTitle")}</h2>
      <EmptyState
        icon={UsersIcon}
        title={t("common.comingSoon")}
        description={t("rightPanel.suggestedEmpty")}
      />
    </aside>
  );
}
