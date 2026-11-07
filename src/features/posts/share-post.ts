/** Path of a post's own page (FR-POST-06). */
export function postHref(postId: string): string {
  return `/posts/${encodeURIComponent(postId)}`;
}

/** Absolute URL of a post's page on the current origin, for sharing. */
export function absolutePostUrl(postId: string, origin: string): string {
  return new URL(postHref(postId), origin).toString();
}

/**
 * Copies a post's absolute link to the clipboard (FR-FEED-05). Resolves to false
 * instead of throwing when the Clipboard API is missing (e.g. plain HTTP) or the
 * browser refuses (permission denied, page not focused).
 */
export async function copyPostLink(postId: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(absolutePostUrl(postId, window.location.origin));
    return true;
  } catch {
    return false;
  }
}
