import { describe, expect, it } from "vitest";

import {
  completeSignIn,
  endSessionWithFullReload,
  type DocumentLocation,
} from "./session-navigation";

/** A fake window.location that records full page loads in `log`. */
function fakeLocation(log: string[], search = ""): DocumentLocation {
  return { search, assign: (url: string | URL) => void log.push(`assign ${String(url)}`) };
}

describe("endSessionWithFullReload", () => {
  it("clears the cache before loading the destination as a new document", () => {
    const log: string[] = [];
    endSessionWithFullReload({ clear: () => void log.push("clear") }, "/login", fakeLocation(log));
    expect(log).toEqual(["clear", "assign /login"]);
  });

  it("keeps the return path for an expired session", () => {
    const log: string[] = [];
    endSessionWithFullReload(
      { clear: () => undefined },
      "/login?next=%2Fposts%2F1",
      fakeLocation(log),
    );
    expect(log).toEqual(["assign /login?next=%2Fposts%2F1"]);
  });
});

// Regression for #29: signing in must load a new document, never a client-side navigation.
describe("completeSignIn", () => {
  it("loads the validated next path as a new document", () => {
    const log: string[] = [];
    completeSignIn("Welcome", fakeLocation(log, "?next=%2Fposts%2Fabc%3Ftab%3Dcomments"));
    expect(log).toEqual(["assign /posts/abc?tab=comments"]);
  });

  it("goes home when next is missing", () => {
    const log: string[] = [];
    completeSignIn("Welcome", fakeLocation(log));
    expect(log).toEqual(["assign /"]);
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "/login"])(
    "goes home instead of the unsafe next %s",
    (next) => {
      const log: string[] = [];
      completeSignIn("Welcome", fakeLocation(log, `?next=${encodeURIComponent(next)}`));
      expect(log).toEqual(["assign /"]);
    },
  );
});
