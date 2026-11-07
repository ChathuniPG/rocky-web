"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/i18n-provider";
import { defaultLocale } from "@/i18n/translate";
import { isApiError, isSessionExpiredError } from "@/lib/api/errors";

const MAX_QUERY_RETRIES = 2;

/**
 * Retries only failures that may pass on their own (network errors, 5xx).
 * A 4xx (bad input, not found, rate limited) gives the same answer again, and an
 * ended session is already redirecting to login.
 */
function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (isSessionExpiredError(error)) return false;
  if (isApiError(error) && error.statusCode >= 400 && error.statusCode < 500) return false;
  return failureCount < MAX_QUERY_RETRIES;
}

/** Default TanStack Query settings for all server data. */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoids an immediate refetch right after hydration or a tab switch.
        staleTime: 30_000,
        retry: shouldRetryQuery,
        // Default, stated on purpose: returning to the tab refreshes stale feeds and
        // notifications. Queries that must not refetch opt out individually.
        refetchOnWindowFocus: true,
      },
      // A retried mutation could act twice (two posts, two comments).
      mutations: { retry: false },
    },
  });
}

/**
 * Client-side providers shared by every page: theme, server-data cache,
 * translations, tooltips and toasts. A client component because each provider
 * holds browser state in React context.
 */
export function Providers({ children }: { children: ReactNode }) {
  // useState (not a module constant) so each browser session gets its own cache
  // and the server never shares one between requests.
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale={defaultLocale}>
          <TooltipProvider delayDuration={300}>
            {children}
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
