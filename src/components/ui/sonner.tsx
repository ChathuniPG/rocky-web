"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTranslations } from "@/i18n/i18n-provider";

/**
 * App-wide toast container (FR-UI-05). Follows the active theme and uses the
 * design tokens; trigger toasts anywhere with `toast.success(...)` from "sonner".
 */
function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();
  const t = useTranslations();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      containerAriaLabel={t("toast.region")}
      icons={{
        success: <CircleCheckIcon className="size-4 text-primary" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4 text-highlight-text" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        closeButtonAriaLabel: t("toast.close"),
        classNames: { toast: "cn-toast" },
      }}
      {...props}
    />
  );
}

export { Toaster };
