"use client";

import { LanguagesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "@/i18n/i18n-provider";
import { chooseLocaleOnDevice, parseLocale } from "@/i18n/locale-storage";
import { locales } from "@/i18n/translate";

/**
 * Language menu for signed-out pages (FR-SET-03), next to the theme toggle.
 * A pick here is a deliberate choice: it is marked as pending and saved to the
 * account after the next sign-in or sign-up, instead of being overridden by
 * the account's language (design.md 7.3). Each language is named in its own language.
 */
export function LanguageMenu({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("settings.language.change")}
          className={className}
        >
          <LanguagesIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => {
            const next = parseLocale(value);
            if (next) chooseLocaleOnDevice(next);
          }}
        >
          {locales.map((option) => (
            <DropdownMenuRadioItem key={option} value={option} lang={option}>
              {t(`languages.${option}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
