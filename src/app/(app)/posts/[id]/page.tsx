import type { Metadata } from "next";
import { Suspense } from "react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { PostCardSkeleton } from "@/components/skeletons";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.post.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * A single post, so shared links work (FR-POST-06). Placeholder. The post id is
 * only known at request time, so that part streams in behind a skeleton (cacheComponents).
 */
export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <>
      <PageHeader title={t("pages.post.title")} />
      <Suspense fallback={<PostCardSkeleton />}>
        <PostPlaceholder params={params} />
      </Suspense>
    </>
  );
}

async function PostPlaceholder({ params }: Pick<PageProps<"/posts/[id]">, "params">) {
  const { id } = await params;
  return <ComingSoon title={id} />;
}
