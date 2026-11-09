import { describe, expect, it } from "vitest";

import { feedScrollRestoreTarget } from "./feed-scroll-restore";

describe("feedScrollRestoreTarget", () => {
  it("returns the saved position when the page is elsewhere", () => {
    // Next.js scrolled a push navigation to the top.
    expect(feedScrollRestoreTarget(2400, 0)).toBe(2400);
  });

  it("returns null when nothing has been saved yet", () => {
    expect(feedScrollRestoreTarget(null, 0)).toBeNull();
  });

  it("returns null when the page is already at the saved position", () => {
    expect(feedScrollRestoreTarget(2400, 2400)).toBeNull();
    expect(feedScrollRestoreTarget(2400, 2400.5)).toBeNull();
  });

  it("restores the top of the feed too", () => {
    expect(feedScrollRestoreTarget(0, 800)).toBe(0);
  });
});
