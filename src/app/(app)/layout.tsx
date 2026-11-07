import { Suspense } from "react";

import { MAIN_CONTENT_ID, SkipLink } from "@/components/skip-link";
import { AuthGate } from "@/features/auth/auth-gate";
import { AuthProvider } from "@/features/auth/auth-provider";
import { NavigationTracker } from "@/features/navigation/navigation-tracker";
import { RightPanel } from "@/features/navigation/right-panel";
import { Sidebar } from "@/features/navigation/sidebar";

/**
 * Layout for every signed-in page (design.md 7.1–7.2): sidebar, the page and,
 * from 1536px, a right-hand panel. A route group `(app)` shares this layout
 * without adding a URL segment. The page decides its own width: the feed and
 * post pages fill the height of the viewport, the others use the `(column)`
 * layout's capped column.
 *
 * The layout stays a server component; AuthProvider and AuthGate are client
 * components that receive the server-rendered shell as `children` and only
 * show it once the user is signed in (ADR-013).
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <AuthProvider>
      <AuthGate>
        <SkipLink />
        <Suspense fallback={null}>
          <NavigationTracker />
        </Suspense>
        {/* From 2xl the whole shell is capped and centred so very wide screens don't stretch it. */}
        <div className="mx-auto flex min-h-dvh w-full 2xl:max-w-400">
          <Sidebar />
          <main id={MAIN_CONTENT_ID} tabIndex={-1} className="min-w-0 flex-1 outline-none">
            {children}
          </main>
          <RightPanel />
        </div>
      </AuthGate>
    </AuthProvider>
  );
}
