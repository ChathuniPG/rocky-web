import type { Metadata } from "next";

import { NotFoundView } from "@/components/not-found-view";
import { DocumentTitle } from "@/i18n/document-title";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.notFound.title") };

/**
 * Shown for any address that matches no route, replacing Next.js's built-in
 * English-only 404 (it renders inside the root layout, so the theme and
 * language apply). It works signed in or out, so it has no app navigation, only
 * a link Home, which leads to login when there is no session.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <DocumentTitle id="pages.notFound.title" />
      <div className="w-full max-w-md">
        <NotFoundView />
      </div>
    </main>
  );
}
