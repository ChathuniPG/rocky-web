"use client";

import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

import { useGoBack } from "./use-go-back";

type BackButtonProps = {
  /**
   * "overlay" (default) is drawn over media: a translucent dark circle keeps the
   * white icon visible on any image, in either theme. "plain" sits on the page
   * background, e.g. in the conversation header.
   */
  tone?: "overlay" | "plain";
  /** Where to go when the page was opened directly; Home by default. */
  fallbackHref?: string;
  className?: string;
};

/** Round "Back" button (FR-POST-07): back to the previous in-app page, or to `fallbackHref`. */
export function BackButton({ tone = "overlay", fallbackHref, className }: BackButtonProps) {
  const t = useTranslations();
  const goBack = useGoBack(fallbackHref);

  return (
    <Button
      variant="ghost"
      size={tone === "overlay" ? "icon-lg" : "icon"}
      aria-label={t("postPage.back")}
      onClick={goBack}
      className={cn(
        "rounded-full",
        tone === "overlay" &&
          "bg-black/55 text-white hover:bg-black/75 hover:text-white active:bg-black/85",
        className,
      )}
    >
      <ArrowLeftIcon aria-hidden="true" />
    </Button>
  );
}
