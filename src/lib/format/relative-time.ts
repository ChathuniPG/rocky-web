/*
 * Locale-aware timestamps built on the browser's Intl APIs, so every language
 * gets its own grammar ("5 minutes ago", "yesterday") without extra dependencies.
 */

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
// Calendar months and years vary; averages are precise enough for "3 months ago".
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

// Largest unit first: the first unit that fits the distance is used.
const UNITS: ReadonlyArray<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: "year", ms: YEAR },
  { unit: "month", ms: MONTH },
  { unit: "week", ms: WEEK },
  { unit: "day", ms: DAY },
  { unit: "hour", ms: HOUR },
  { unit: "minute", ms: MINUTE },
];

/**
 * How long ago (or ahead) `date` is from `now`, in the given locale, e.g.
 * "5 minutes ago", "yesterday", "now". `numeric: "auto"` lets Intl use words like
 * "yesterday". `now` is a parameter so the result is testable.
 */
export function formatRelativeTime(date: Date | string, now: Date, locale: string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  const diff = target.getTime() - now.getTime();
  const distance = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const { unit, ms } of UNITS) {
    if (distance >= ms) return formatter.format(Math.trunc(diff / ms), unit);
  }
  // Under a minute: seconds would tick visibly and add nothing, so clocks a few
  // seconds apart (client vs server) all read as "now".
  return formatter.format(0, "second");
}

/** Full date and time in the given locale, for tooltips next to a relative time. */
export function formatAbsoluteDateTime(date: Date | string, locale: string): string {
  const target = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(target);
}
