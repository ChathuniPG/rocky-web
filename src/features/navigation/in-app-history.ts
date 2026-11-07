/*
 * Remembers whether there is an in-app page to go back to (FR-POST-07). The
 * post page's Back button and Escape key return to it with router.back(); when
 * the page was opened directly (a shared link, a reload) they go to Home
 * instead, so Back never leaves the app.
 *
 * Where the Navigation API exists, the index of the history entry the app
 * started on is recorded; any entry after it belongs to this app session, also
 * after the browser's own back and forward buttons. Elsewhere a flag set on the
 * first client-side navigation stands in for it.
 */

/** The part of the Navigation API used here; TypeScript's DOM types don't include it yet. */
type NavigationLike = { currentEntry: { index: number } | null };

let appStartIndex: number | null = null;
let hasNavigatedInApp = false;

function isNavigationLike(value: unknown): value is NavigationLike {
  return typeof value === "object" && value !== null && "currentEntry" in value;
}

function currentHistoryIndex(): number | null {
  if (typeof window === "undefined") return null;
  const navigation: unknown = Reflect.get(window, "navigation");
  if (!isNavigationLike(navigation)) return null;
  const index = navigation.currentEntry?.index;
  // The index is -1 for entries the API can't see (e.g. after a cross-origin redirect).
  return typeof index === "number" && index >= 0 ? index : null;
}

/** Whether an entry of this app session lies behind the current one. */
export function hasInAppEntryBehind(startIndex: number, currentIndex: number): boolean {
  return currentIndex > startIndex;
}

/** Records the history entry the signed-in app was first shown on. Only the first call counts. */
export function recordAppStart(): void {
  if (appStartIndex === null) appStartIndex = currentHistoryIndex();
}

/** Records a client-side navigation between app pages (the fallback signal). */
export function recordInAppNavigation(): void {
  hasNavigatedInApp = true;
}

/** Whether going back in history stays on an in-app page, rather than leaving the app. */
export function canReturnInApp(): boolean {
  const currentIndex = currentHistoryIndex();
  if (appStartIndex !== null && currentIndex !== null) {
    return hasInAppEntryBehind(appStartIndex, currentIndex);
  }
  return hasNavigatedInApp;
}
