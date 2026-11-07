"use client";

import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { useGoBack } from "./use-go-back";

/**
 * Round "Back" button drawn over media (FR-POST-07). The translucent dark
 * background keeps the white icon visible on any image, in either theme.
 */
export function BackButton({ className }: { className?: string }) {
  const t = useTranslations();
  const goBack = useGoBack();

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      aria-label={t("postPage.back")}
      onClick={goBack}
      className={cn(
        "rounded-full bg-black/55 text-white hover:bg-black/75 hover:text-white active:bg-black/85",
        className,
      )}
    >
      <ArrowLeftIcon aria-hidden="true" />
    </Button>
  );
}
