import { TranslatedText } from "@/i18n/translated-text";

/** Must match the `id` on the page's `<main>`. */
export const MAIN_CONTENT_ID = "main-content";

/**
 * Hidden until focused: lets keyboard users jump past the sidebar to the page
 * content (NFR-UX-02).
 */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:ring-3 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:outline-none"
    >
      <TranslatedText id="nav.skipToContent" />
    </a>
  );
}
