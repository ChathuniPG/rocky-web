import { describe, expect, it } from "vitest";

import { resolvePlayerKey, type PlayerKeyContext } from "./video-player-keys";

function press(key: string, overrides: Partial<PlayerKeyContext> = {}) {
  return resolvePlayerKey({
    key,
    target: "player",
    hasModifier: false,
    isComposing: false,
    ...overrides,
  });
}

describe("resolvePlayerKey", () => {
  it("maps the player shortcuts", () => {
    expect(press(" ")).toBe("toggle");
    expect(press("k")).toBe("toggle");
    expect(press("K")).toBe("toggle");
    expect(press("m")).toBe("mute");
    expect(press("ArrowLeft")).toBe("seekBack");
    expect(press("ArrowRight")).toBe("seekForward");
    expect(press("ArrowUp")).toBe("volumeUp");
    expect(press("ArrowDown")).toBe("volumeDown");
  });

  it("leaves other keys, such as Page Down, to the browser", () => {
    expect(press("PageDown")).toBeNull();
    expect(press("Enter")).toBeNull();
    expect(press("a")).toBeNull();
  });

  it("never intercepts typing, IME composition or modified keys", () => {
    expect(press("k", { target: "editable" })).toBeNull();
    expect(press("m", { isComposing: true })).toBeNull();
    expect(press("ArrowLeft", { hasModifier: true })).toBeNull();
  });

  it("lets a focused button handle Space itself", () => {
    expect(press(" ", { target: "button" })).toBeNull();
    expect(press("k", { target: "button" })).toBe("toggle");
    expect(press("ArrowRight", { target: "button" })).toBe("seekForward");
  });

  it("lets a focused slider handle the arrow keys itself", () => {
    expect(press("ArrowLeft", { target: "slider" })).toBeNull();
    expect(press("ArrowUp", { target: "slider" })).toBeNull();
    expect(press(" ", { target: "slider" })).toBe("toggle");
    expect(press("m", { target: "slider" })).toBe("mute");
  });
});
