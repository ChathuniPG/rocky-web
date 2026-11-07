import { describe, expect, it } from "vitest";

import { type EscapeKeyContext, isGoBackEscape } from "./go-back-escape";

const plainEscape: EscapeKeyContext = {
  key: "Escape",
  defaultPrevented: false,
  isComposing: false,
  hasModifier: false,
  targetIsEditable: false,
  overlayOpen: false,
  isFullscreen: false,
};

describe("isGoBackEscape", () => {
  it("accepts a plain Escape", () => {
    expect(isGoBackEscape(plainEscape)).toBe(true);
  });

  it("ignores other keys", () => {
    expect(isGoBackEscape({ ...plainEscape, key: "Enter" })).toBe(false);
  });

  it.each<[string, Partial<EscapeKeyContext>]>([
    ["handled by a dialog or menu", { defaultPrevented: true }],
    ["part of an IME composition", { isComposing: true }],
    ["pressed with a modifier", { hasModifier: true }],
    ["typed in a field", { targetIsEditable: true }],
    ["pressed while an overlay is open", { overlayOpen: true }],
    ["pressed in fullscreen", { isFullscreen: true }],
  ])("ignores Escape %s", (_, override) => {
    expect(isGoBackEscape({ ...plainEscape, ...override })).toBe(false);
  });
});
