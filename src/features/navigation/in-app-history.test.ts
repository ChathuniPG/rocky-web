import { describe, expect, it } from "vitest";

import { hasInAppEntryBehind } from "./in-app-history";

describe("hasInAppEntryBehind", () => {
  it("is false on the entry the app started on (opened directly)", () => {
    expect(hasInAppEntryBehind(3, 3)).toBe(false);
  });

  it("is true once the user has moved forward within the app", () => {
    expect(hasInAppEntryBehind(3, 4)).toBe(true);
  });

  it("is false before the app's first entry", () => {
    expect(hasInAppEntryBehind(3, 2)).toBe(false);
  });
});
