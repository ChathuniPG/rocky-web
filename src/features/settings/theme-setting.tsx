"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { RadioGroup } from "@/components/ui/radio-group";
import { useTranslations } from "@/i18n/i18n-provider";

import { SettingOption } from "./setting-option";
import { SettingsSection, settingsHeadingId } from "./settings-section";

const themeOptions = [
  { value: "light", labelKey: "theme.light", icon: SunIcon },
  { value: "dark", labelKey: "theme.dark", icon: MoonIcon },
  { value: "system", labelKey: "theme.system", icon: MonitorIcon },
] as const;

/**
 * Light / Dark / System (FR-SET-01). next-themes applies the choice at once
 * and remembers it on this device. The page only renders in the browser after
 * sign-in (ADR-013), so the stored theme is already known and the selected
 * option can't differ between server and client.
 */
export function ThemeSetting() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  return (
    <SettingsSection
      id="appearance"
      title={t("settings.appearance.title")}
      description={t("settings.appearance.description")}
    >
      <RadioGroup
        aria-labelledby={settingsHeadingId("appearance")}
        value={theme ?? "system"}
        onValueChange={setTheme}
        className="sm:grid-cols-3"
      >
        {themeOptions.map(({ value, labelKey, icon }) => (
          <SettingOption key={value} groupId="theme" value={value} icon={icon}>
            {t(labelKey)}
          </SettingOption>
        ))}
      </RadioGroup>
    </SettingsSection>
  );
}
