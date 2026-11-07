"use client";

import { CircleAlertIcon, SearchIcon, UserRoundSearchIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { InfiniteListFooter } from "@/components/infinite-list-footer";
import { SearchInput } from "@/components/search-input";
import { ListRowSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserSearchFilter } from "@/features/users/user-query-keys";
import { useTranslations } from "@/i18n/i18n-provider";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import { cn } from "@/lib/utils";

import {
  buildSearchHref,
  normalizeSearchQuery,
  parseSearchFilter,
  readSearchState,
  SEARCH_QUERY_MAX_LENGTH,
} from "./search-params";
import { useUserSearch } from "./use-user-search";
import { UserSearchResultRow } from "./user-search-result";

const SEARCH_DEBOUNCE_MS = 300;
const SKELETON_ROWS = 6;

/**
 * The search page's interactive part (FR-SRCH-01..04). The query and the filter
 * live in the URL, so reload, Back and Forward restore the state. Reads
 * useSearchParams, so the page wraps it in Suspense (cacheComponents).
 */
export function SearchPageContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { query, filter } = readSearchState(searchParams);
  const apiQuery = normalizeSearchQuery(query);

  // The input keeps its own text while typing (it only reports pauses). When
  // the URL's query changes for another reason – Back, Forward, a link to
  // /search – the input is remounted with the URL's text. A change this page
  // wrote itself is recognised and leaves the input (focus, caret) alone. This
  // is React's "adjust state while rendering" pattern, not an effect, so the
  // input never shows stale text for a frame.
  const [urlQuery, setUrlQuery] = useState(query);
  const [expectedQuery, setExpectedQuery] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  if (query !== urlQuery) {
    setUrlQuery(query);
    if (query !== expectedQuery) setInputKey((key) => key + 1);
    setExpectedQuery(null);
  }

  // The debounce timer calls back with the props of the render it started in;
  // the ref gives it the filter that is current when it fires.
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  function writeQuery(typed: string) {
    const next = normalizeSearchQuery(typed);
    if (next === apiQuery) return;
    setExpectedQuery(next);
    replaceSearchUrl(buildSearchHref({ query: next, filter: filterRef.current }));
  }

  function writeFilter(value: string) {
    const next = parseSearchFilter(value);
    filterRef.current = next;
    replaceSearchUrl(buildSearchHref({ query: apiQuery, filter: next }));
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        key={inputKey}
        defaultValue={query}
        debounceMs={SEARCH_DEBOUNCE_MS}
        onDebouncedChange={writeQuery}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        enterKeyHint="search"
      />

      <Tabs value={filter} onValueChange={writeFilter}>
        <TabsList variant="line" aria-label={t("search.filter.label")}>
          <TabsTrigger value="all">{t("search.filter.all")}</TabsTrigger>
          <TabsTrigger value="following">{t("search.filter.following")}</TabsTrigger>
        </TabsList>
        {/* Radix mounts only the active panel, so only one search runs. */}
        <TabsContent value="all" className="mt-2">
          <SearchResults query={apiQuery} filter="all" />
        </TabsContent>
        <TabsContent value="following" className="mt-2">
          <SearchResults query={apiQuery} filter="following" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Rewrites the current history entry, so typing adds no Back steps. The native
 * History API is used instead of router.replace: Next.js syncs it with
 * useSearchParams without a server request, while router.replace fetched the
 * page's server payload on every pause and the search waited for it. The page
 * itself doesn't depend on the search params on the server, so nothing is lost.
 * It never scrolls, unlike a router navigation.
 */
function replaceSearchUrl(href: string) {
  window.history.replaceState(null, "", href);
}

/** The results for one query and filter, with prompt, loading, empty and error states. */
function SearchResults({ query, filter }: { query: string; filter: UserSearchFilter }) {
  const t = useTranslations();
  const search = useUserSearch(query, filter);
  const users = search.data?.pages.flatMap((page) => page.items) ?? [];

  if (query === "") {
    return (
      <EmptyState
        icon={SearchIcon}
        title={t("search.prompt.title")}
        description={t(
          filter === "following"
            ? "search.prompt.followingDescription"
            : "search.prompt.description",
        )}
      />
    );
  }

  if (search.isPending) return <SearchResultsSkeleton />;

  if (search.isError && !search.isFetchNextPageError) {
    return (
      <EmptyState
        icon={CircleAlertIcon}
        title={t("search.error.title")}
        description={t(mapApiErrorToMessageKey(search.error))}
        action={
          <Button loading={search.isFetching} onClick={() => void search.refetch()}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  // Results of the previous query stay visible, dimmed, while the new one loads.
  const isStale = search.isPlaceholderData;

  if (users.length === 0 && !isStale) {
    return (
      <>
        <p role="status" className="sr-only">
          {t("search.empty.title", { query })}
        </p>
        <EmptyState
          icon={UserRoundSearchIcon}
          title={t("search.empty.title", { query })}
          description={t(
            filter === "following"
              ? "search.empty.followingDescription"
              : "search.empty.description",
          )}
        />
      </>
    );
  }

  return (
    <section aria-label={t("search.resultsLabel")} aria-busy={isStale || undefined}>
      <p role="status" className="sr-only">
        {isStale ? t("search.searching") : t("search.resultsStatus", { query })}
      </p>
      <ul className={cn("flex flex-col transition-opacity", isStale && "opacity-60")}>
        {users.map((user) => (
          <li key={user.id}>
            <UserSearchResultRow user={user} />
          </li>
        ))}
      </ul>
      {isStale ? null : (
        <InfiniteListFooter
          hasNextPage={search.hasNextPage}
          isFetchingNextPage={search.isFetchingNextPage}
          isFetchNextPageError={search.isFetchNextPageError}
          fetchNextPage={() => void search.fetchNextPage({ cancelRefetch: false })}
          loadMoreLabel={t("search.loadMore")}
        />
      )}
    </section>
  );
}

/** Skeleton rows shaped like results, announced once as "Searching…" (FR-UI-03). */
function SearchResultsSkeleton() {
  const t = useTranslations();
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        {t("search.searching")}
      </p>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <ListRowSkeleton key={index} withTrailing />
      ))}
    </div>
  );
}

/** Shown while the URL-reading part of the page streams in (cacheComponents). */
export function SearchPageSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full rounded-full" />
      <div className="flex gap-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-28" />
      </div>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <ListRowSkeleton key={index} withTrailing />
      ))}
    </div>
  );
}
