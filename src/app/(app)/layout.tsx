import { MAIN_CONTENT_ID, SkipLink } from "@/components/skip-link";
import { RightPanel } from "@/features/navigation/right-panel";
import { Sidebar } from "@/features/navigation/sidebar";

/**
 * Layout for every signed-in page (design.md 7.1–7.2): sidebar, a centred and
 * width-capped content column and, from 1536px, a right-hand panel. A route
 * group `(app)` shares this layout without adding a URL segment.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SkipLink />
      {/* From 2xl the whole shell is capped and centred so very wide screens don't stretch it. */}
      <div className="mx-auto flex min-h-dvh w-full 2xl:max-w-400">
        <Sidebar />
        <main id={MAIN_CONTENT_ID} tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <div className="mx-auto w-full max-w-2xl px-4 py-6 lg:px-6">{children}</div>
        </main>
        <RightPanel />
      </div>
    </>
  );
}
