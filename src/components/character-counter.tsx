"use client";

import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type CharacterCounterProps = {
  /** Referenced from the field's aria-describedby, so the count is read with the field. */
  id: string;
  count: number;
  max: number;
  className?: string;
};

// Within this many characters of the limit the counter turns orange as a warning.
const WARNING_THRESHOLD = 0.9;

/**
 * "120 / 500" under a text field. Orange near the limit, red past it. The
 * visible text is compact; screen readers get a full sentence instead.
 */
export function CharacterCounter({ id, count, max, className }: CharacterCounterProps) {
  const t = useTranslations();
  const isOver = count > max;
  const isNear = !isOver && count >= max * WARNING_THRESHOLD;

  return (
    <p
      id={id}
      className={cn(
        "text-xs text-muted-foreground tabular-nums",
        isNear && "text-highlight-text",
        isOver && "font-medium text-destructive",
        className,
      )}
    >
      <span aria-hidden="true">
        {count} / {max}
      </span>
      <span className="sr-only">{t("common.characterCount", { count, max })}</span>
    </p>
  );
}
