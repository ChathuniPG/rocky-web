"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

type AuthSwitchLinkProps = {
  href: "/login" | "/signup";
  children: ReactNode;
};

const linkClasses =
  "rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring active:opacity-80";

/**
 * Link between /login and /signup that keeps the `next` parameter, so switching
 * forms still returns the user to the page they came from.
 */
export function AuthSwitchLink({ href, children }: AuthSwitchLinkProps) {
  // Search params are unknown while prerendering (cacheComponents), so the
  // static shell shows the link without `next` until the browser fills it in.
  return (
    <Suspense
      fallback={
        <Link href={href} className={linkClasses}>
          {children}
        </Link>
      }
    >
      <LinkWithNext href={href}>{children}</LinkWithNext>
    </Suspense>
  );
}

function LinkWithNext({ href, children }: AuthSwitchLinkProps) {
  const next = useSearchParams().get("next");
  const target = next ? `${href}?${new URLSearchParams({ next }).toString()}` : href;
  return (
    <Link href={target} className={linkClasses}>
      {children}
    </Link>
  );
}
