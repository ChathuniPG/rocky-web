/** Where to go when `next` is missing or unsafe. */
export const DEFAULT_REDIRECT_PATH = "/";

// Sending a freshly signed-in user back to an auth page would just bounce them again.
const AUTH_PATHS = new Set(["/login", "/signup"]);

// Control characters (incl. tab and newline) are stripped by URL parsers, so
// "/\t/evil.com" could become "//evil.com". Reject them outright.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/**
 * Validates the `next` query parameter used after login. Only same-site relative
 * paths (exactly one leading "/") are accepted, which prevents open redirects
 * such as `//evil.com` or `/\evil.com` (browsers treat both as another host).
 * Anything else, and the auth pages themselves, fall back to "/".
 */
export function getSafeRedirectPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_REDIRECT_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT_PATH;
  if (value.includes("\\") || CONTROL_CHARACTERS.test(value)) return DEFAULT_REDIRECT_PATH;

  // Final check with the real parser: the result must stay on our origin.
  const base = "http://same.site";
  let url: URL;
  try {
    url = new URL(value, base);
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
  if (url.origin !== base) return DEFAULT_REDIRECT_PATH;
  if (AUTH_PATHS.has(url.pathname)) return DEFAULT_REDIRECT_PATH;

  return value;
}
