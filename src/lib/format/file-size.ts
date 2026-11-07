const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;

/**
 * A file size in the user's language, e.g. "4.2 MB" or "820 kB". Uses binary
 * units (1 MB = 1,024 × 1,024 bytes), matching the upload limits.
 */
export function formatFileSize(bytes: number, locale: string): string {
  const [value, unit] =
    bytes >= MEGABYTE ? [bytes / MEGABYTE, "megabyte"] : [bytes / KILOBYTE, "kilobyte"];
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    maximumFractionDigits: 1,
  }).format(value);
}
