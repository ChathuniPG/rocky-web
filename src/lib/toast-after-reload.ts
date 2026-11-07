/*
 * A success toast that survives one full page load. Login, sign-up and logout
 * end with a full page load (see session-navigation.ts), which would drop a
 * toast shown just before it. The message waits in sessionStorage instead and
 * <ToastAfterReload /> shows it once on the next page.
 */

const STORAGE_KEY = "rocky:toast-after-reload";

/** The part of Storage used here; tests pass a fake. */
export type ToastStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function sessionStorageOrUndefined(): ToastStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    // Storage can be blocked (privacy settings); the toast is then simply skipped.
    return undefined;
  }
}

/** Keeps `message` to be shown as a success toast after the next page load. */
export function queueToastAfterReload(
  message: string,
  storage: ToastStorage | undefined = sessionStorageOrUndefined(),
): void {
  try {
    storage?.setItem(STORAGE_KEY, message);
  } catch {
    // Full or blocked storage: losing a confirmation toast is acceptable.
  }
}

/** Returns the queued message, if any, and removes it so it is shown only once. */
export function takeToastAfterReload(
  storage: ToastStorage | undefined = sessionStorageOrUndefined(),
): string | null {
  try {
    const message = storage?.getItem(STORAGE_KEY) ?? null;
    if (message !== null) storage?.removeItem(STORAGE_KEY);
    return message || null;
  } catch {
    return null;
  }
}
