/*
 * Keyboard shortcuts for the video player (FR-FEED-09). Pure, so the rules
 * can be tested without a DOM: the player passes in what kind of element the
 * key went to.
 */

/** What a key press asks the player to do. */
export type PlayerKeyAction =
  "toggle" | "mute" | "seekBack" | "seekForward" | "volumeUp" | "volumeDown";

/** The kind of element inside the player that had focus. */
export type PlayerKeyTarget = "player" | "button" | "slider" | "editable";

/** Everything that decides whether a key press is a player shortcut. */
export type PlayerKeyContext = {
  key: string;
  target: PlayerKeyTarget;
  /** Ctrl, Alt or Meta held: leave browser and OS shortcuts alone. */
  hasModifier: boolean;
  /** Part of an IME composition (e.g. typing Sinhala). */
  isComposing: boolean;
};

/**
 * Maps a key press inside the player to an action, or null to let the
 * browser handle it. Space and Enter on a focused button stay native (the
 * button clicks itself), and the arrow keys on a focused slider stay with the
 * slider, so nothing happens twice.
 */
export function resolvePlayerKey(context: PlayerKeyContext): PlayerKeyAction | null {
  const { key, target } = context;
  if (context.hasModifier || context.isComposing || target === "editable") return null;

  switch (key) {
    case " ":
      return target === "button" ? null : "toggle";
    case "k":
    case "K":
      return "toggle";
    case "m":
    case "M":
      return "mute";
    case "ArrowLeft":
      return target === "slider" ? null : "seekBack";
    case "ArrowRight":
      return target === "slider" ? null : "seekForward";
    case "ArrowUp":
      return target === "slider" ? null : "volumeUp";
    case "ArrowDown":
      return target === "slider" ? null : "volumeDown";
    default:
      return null;
  }
}
