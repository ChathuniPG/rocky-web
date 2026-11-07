"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/i18n/i18n-provider";
import { defaultLocale } from "@/i18n/translate";

/** Default TanStack Query settings for all server data. */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoids an immediate refetch right after hydration or a tab switch.
        staleTime: 30_000,
        retry: 1,
      },
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
