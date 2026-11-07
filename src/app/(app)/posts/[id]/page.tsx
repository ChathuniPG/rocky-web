import type { Metadata } from "next";
import { Suspense } from "react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { PostCardSkeleton } from "@/components/skeletons";
import { getTranslations } from "@/i18n/server";

const t = getTranslations();

export const metadata: Metadata = { title: t("pages.post.title") };

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
