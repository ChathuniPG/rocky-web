import { describe, expect, it } from "vitest";

import { mostVisibleIndex } from "./most-visible-index";

describe("mostVisibleIndex", () => {
  it("picks the item with the largest visible ratio", () => {
    expect(mostVisibleIndex([0.2, 0.8, 0])).toBe(1);
  });

  it("keeps the first item on a tie", () => {
    expect(mostVisibleIndex([0.5, 0.5])).toBe(0);
  });

  it("returns null when nothing is visible", () => {
    expect(mostVisibleIndex([0, 0])).toBeNull();
    expect(mostVisibleIndex([])).toBeNull();
  });
});
