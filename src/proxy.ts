import { NextResponse, type NextRequest } from "next/server";

/** The API's httpOnly ID-token cookie (design.md 3.2). Only its presence is checked. */
const ID_TOKEN_COOKIE = "rocky_id";

/**
 * Sends visitors who still have an ID-token cookie away from /login and /signup
 * to the home page. It does not protect app routes (ADR-013): rocky_id expires
 * after an hour while the session lives on, and the refresh cookie is never sent
 * with page requests, so only the client (via /auth/me and refresh) can tell
 * whether a session is valid. The API remains the security boundary.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(ID_TOKEN_COOKIE)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup"],
};
