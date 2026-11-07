/**
 * The centred, width-capped content column (design.md 7.2) shared by list and
 * form pages: search, profile, notifications, messages and settings. The route
 * group `(column)` adds this wrapper without adding a URL segment; the feed and
 * post pages sit outside it because they fill the viewport height.
 */
export default function ColumnLayout({ children }: LayoutProps<"/">) {
  return <div className="mx-auto w-full max-w-2xl px-4 py-6 lg:px-6">{children}</div>;
}
