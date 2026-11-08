import { useEffect, useRef, type FocusEvent, type RefObject } from "react";

/** Focus handlers to spread on the element that may disappear. */
type FocusHandoffHandlers = {
  onFocus: () => void;
  onBlur: (event: FocusEvent) => void;
};

/**
 * Hands keyboard focus to `target` when a focused element is removed, e.g. a
 * "Load more" button once the last page has loaded. Without this, focus falls
 * to <body> and keyboard users start again from the top (WCAG 2.4.3, NFR-UX-02).
 *
 * `isPresent` is whether the element is currently rendered. Spread the returned
 * handlers on it. Focus only moves if nothing else has taken it in the meantime.
 */
export function useFocusHandoff(
  isPresent: boolean,
  target: RefObject<HTMLElement | null>,
): FocusHandoffHandlers {
  const hadFocusRef = useRef(false);

  useEffect(() => {
    if (isPresent || !hadFocusRef.current) return;
    hadFocusRef.current = false;
    const active = document.activeElement;
    if (active === null || active === document.body) target.current?.focus({ preventScroll: true });
  }, [isPresent, target]);

  return {
    onFocus: () => {
      hadFocusRef.current = true;
    },
    // A removed element blurs without a relatedTarget; only a real move elsewhere clears the flag.
    onBlur: (event) => {
      if (event.relatedTarget) hadFocusRef.current = false;
    },
  };
}
