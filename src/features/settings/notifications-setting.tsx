"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/features/auth/auth-provider";
import { useTranslations } from "@/i18n/i18n-provider";

import { SettingsSection } from "./settings-section";
import { useUpdateSetting } from "./use-update-setting";

const SWITCH_ID = "settings-notifications-switch";
const HINT_ID = "settings-notifications-hint";

/**
 * Turns notifications on or off (FR-SET-02). Stored on the server; while off,
 * likes, comments and follows create no new notifications. The switch reads
 * the cached signed-in user, which the save updates optimistically.
 */
export function NotificationsSetting() {
  const t = useTranslations();
  const user = useCurrentUser();
  const { mutate: updateSetting } = useUpdateSetting();

  return (
    <SettingsSection
      id="notifications"
      title={t("settings.notifications.title")}
      description={t("settings.notifications.description")}
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-1">
          <Label htmlFor={SWITCH_ID} className="leading-normal">
            {t("settings.notifications.label")}
          </Label>
          <p id={HINT_ID} className="text-sm text-muted-foreground">
            {t("settings.notifications.hint")}
          </p>
        </div>
        <Switch
          id={SWITCH_ID}
          aria-describedby={HINT_ID}
          checked={user.notificationsEnabled}
          onCheckedChange={(checked) =>
            updateSetting({ field: "notificationsEnabled", value: checked })
          }
        />
      </div>
    </SettingsSection>
  );
}
