/** Short, locale-aware count for action buttons, e.g. 1234 → "1.2K" in English. */
export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}
