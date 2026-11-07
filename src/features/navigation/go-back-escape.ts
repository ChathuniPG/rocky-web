/** What decides whether an Escape key press should leave the page. */
export type EscapeKeyContext = {
  key: string;
  /** Already handled, e.g. Radix closed a dialog or menu with it. */
  defaultPrevented: boolean;
  /** Part of an IME composition (e.g. typing Sinhala). */
  isComposing: boolean;
  hasModifier: boolean;
  /** The key went to a text field or other editable element. */
  targetIsEditable: boolean;
  /** A dialog or menu is open. */
  overlayOpen: boolean;
  /** A video is fullscreen; Escape exits fullscreen instead. */
  isFullscreen: boolean;
};

/**
 * Whether an Escape key press means "go back" on the post page (FR-POST-07):
 * only a plain Escape that nothing else wants, i.e. not while typing, not while
 * a dialog or menu is open and not to leave fullscreen.
 */
export function isGoBackEscape(context: EscapeKeyContext): boolean {
  return (
    context.key === "Escape" &&
    !context.defaultPrevented &&
    !context.isComposing &&
    !context.hasModifier &&
    !context.targetIsEditable &&
    !context.overlayOpen &&
    !context.isFullscreen
  );
}
