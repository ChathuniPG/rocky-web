"use client";

import { FileQuestionIcon } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";

/**
 * The page for an address that matches no route: a translated heading,
 * explanation and a way back Home (WCAG 2.4.2, FR-SET-03). A client component
 * so the text follows the active language.
 */
export function NotFoundView() {
  const t = useTranslations();
  return (
    <EmptyState
      icon={FileQuestionIcon}
      titleAs="h1"
      title={t("pages.notFound.title")}
      description={t("pages.notFound.description")}
      action={
        <Button asChild>
          <Link href="/">{t("pages.notFound.backHome")}</Link>
        </Button>
      }
    />
  );
}
