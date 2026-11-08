"use client";

import { useEffect } from "react";

import { useTranslations } from "./i18n-provider";
import type { TranslationKey } from "./translate";

/**
 * Sets the browser tab title in the active language, e.g. "මුල් පිටුව · R.O.C.K.Y."
 * (WCAG 2.4.2). Server components only know the default language, so each page
 * keeps its static `metadata.title` as the English fallback (and for crawlers)
 * and also renders this.
 *
 * Next.js can write the English title back after the page mounts (metadata is
 * streamed, and client navigations update it), so a title change made by anyone
 * else is undone while this is mounted.
 */
export function DocumentTitle({ id }: { id: TranslationKey }) {
  const t = useTranslations();
  // Same pattern as the root layout's `title.template`.
  const title = `${t(id)} · ${t("common.appName")}`;

  useEffect(() => {
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);

  return null;
}
