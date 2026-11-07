"use client";

import { useLocale } from "@/i18n/i18n-provider";
import { formatAbsoluteDateTime, formatRelativeTime } from "@/lib/format/relative-time";
import { cn } from "@/lib/utils";

type RelativeTimeProps = {
  /** ISO timestamp from the API. */
  dateTime: string;
  className?: string;
};

/**
 * A timestamp shown as "5 minutes ago" in the current language, with the full
 * date and time on hover and a machine-readable `<time dateTime>`. A client
 * component because "now" is the viewer's clock; signed-in pages render only in
 * the browser anyway (ADR-013), so there is no server/client mismatch.
 */
export function RelativeTime({ dateTime, className }: RelativeTimeProps) {
  const locale = useLocale();
  return (
    <time
      dateTime={dateTime}
      title={formatAbsoluteDateTime(dateTime, locale)}
      className={cn("text-xs text-muted-foreground", className)}
    >
      {formatRelativeTime(dateTime, new Date(), locale)}
    </time>
  );
}
