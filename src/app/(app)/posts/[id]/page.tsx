import type { Metadata } from "next";
import { Suspense } from "react";

import { PostDetail } from "@/features/posts/post-detail";
import { PostDetailSkeleton } from "@/features/posts/post-detail-skeleton";
import { DocumentTitle } from "@/i18n/document-title";
import { getTranslations } from "@/i18n/server";
import { TranslatedText } from "@/i18n/translated-text";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.post.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * A single post with its comments, so shared links work (FR-POST-06,
 * FR-POST-07, FR-FEED-06). The post id is only known at request time, so that
 * part streams in behind a skeleton (cacheComponents); the post itself loads in
 * the browser. The media fills the page, so the page title is visually hidden.
 */
export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <>
      <DocumentTitle id="pages.post.title" />
      <h1 className="sr-only">
        <TranslatedText id="pages.post.title" />
      </h1>
      <Suspense fallback={<PostDetailSkeleton />}>
        <PostDetailForParams params={params} />
      </Suspense>
    </>
  );
}

async function PostDetailForParams({ params }: Pick<PageProps<"/posts/[id]">, "params">) {
  const { id } = await params;
  return <PostDetail postId={id} />;
}
