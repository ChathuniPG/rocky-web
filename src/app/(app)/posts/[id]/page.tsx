import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/page-header";
import { PostCardSkeleton } from "@/components/skeletons";
import { PostDetail } from "@/features/posts/post-detail";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.post.title") };

// Rendered only after AuthGate confirms the session in the browser (ADR-013), so
// Next.js cannot prerender this page to validate instant navigation.
export const instant = false;

/**
 * A single post with its comments, so shared links work (FR-POST-06,
 * FR-FEED-06). The post id is only known at request time, so that part streams
 * in behind a skeleton (cacheComponents); the post itself loads in the browser.
 */
export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <>
      <PageHeader title={t("pages.post.title")} />
      <Suspense fallback={<PostCardSkeleton />}>
        <PostDetailForParams params={params} />
      </Suspense>
    </>
  );
}

async function PostDetailForParams({ params }: Pick<PageProps<"/posts/[id]">, "params">) {
  const { id } = await params;
  return <PostDetail postId={id} />;
}
