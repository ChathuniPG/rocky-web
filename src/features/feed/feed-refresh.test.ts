import { describe, expect, it } from "vitest";

import { isRefreshRendered, refreshResultAction } from "./feed-refresh";

type Feed = { pages: string[] };

describe("refreshResultAction", () => {
  const onScreen: Feed = { pages: ["a"] };

  it("follows up straight away when the refresh returned the data already on screen", () => {
    // No new posts: structural sharing returns the same reference, so nothing re-renders.
    expect(
      refreshResultAction({ isError: false, data: onScreen, rendered: onScreen, shown: true }),
    ).toBe("now");
  });

  it("waits for new data to render first", () => {
    const refreshed: Feed = { pages: ["new", "a"] };
    expect(
      refreshResultAction({ isError: false, data: refreshed, rendered: onScreen, shown: true }),
    ).toBe("wait");
  });

  it("skips a refresh that finished while the feed is hidden", () => {
    expect(
      refreshResultAction({ isError: false, data: onScreen, rendered: onScreen, shown: false }),
    ).toBe("skip");
    expect(
      refreshResultAction({
        isError: false,
        data: { pages: [] },
        rendered: onScreen,
        shown: false,
      }),
    ).toBe("skip");
  });

  it("skips a failed refresh", () => {
    expect(
      refreshResultAction({ isError: true, data: onScreen, rendered: onScreen, shown: true }),
    ).toBe("skip");
    expect(
      refreshResultAction<Feed>({
        isError: false,
        data: undefined,
        rendered: onScreen,
        shown: true,
      }),
    ).toBe("skip");
  });
});

describe("isRefreshRendered", () => {
  const before: Feed = { pages: ["a"] };
  const refreshed: Feed = { pages: ["new", "a"] };

  it("is false while the old data is still on screen, true once the new data renders", () => {
    const request = { token: 0, data: refreshed };
    expect(isRefreshRendered(request, before, -1)).toBe(false);
    expect(isRefreshRendered(request, refreshed, -1)).toBe(true);
  });

  it("is false once that refresh has been handled", () => {
    expect(isRefreshRendered({ token: 0, data: refreshed }, refreshed, 0)).toBe(false);
  });

  it("treats two refreshes in a row with the same data as two requests", () => {
    // The first was handled; the second returned the very same object but has its own token.
    expect(isRefreshRendered({ token: 1, data: refreshed }, refreshed, 0)).toBe(true);
  });

  it("drops a refresh that was still waiting when the feed was hidden", () => {
    // On being shown again, every token started so far (here 0 and 1) counts as handled.
    expect(isRefreshRendered({ token: 1, data: refreshed }, refreshed, 1)).toBe(false);
  });

  it("is false when no refresh is waiting", () => {
    expect(isRefreshRendered<Feed>(null, before, -1)).toBe(false);
  });
});
