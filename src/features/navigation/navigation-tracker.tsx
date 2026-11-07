"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { recordAppStart, recordInAppNavigation } from "./in-app-history";

/**
 * Feeds in-app-history: records where the signed-in app started and every
 * later client-side page change, so Back on the post page knows whether to go
 * back or home (FR-POST-07). Renders nothing. Needs a Suspense boundary because
 * `usePathname` suspends while prerendering under cacheComponents.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  const firstPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (firstPathnameRef.current === null) {
      firstPathnameRef.current = pathname;
      recordAppStart();
    } else if (pathname !== firstPathnameRef.current) {
      recordInAppNavigation();
    }
  }, [pathname]);

  return null;
}
