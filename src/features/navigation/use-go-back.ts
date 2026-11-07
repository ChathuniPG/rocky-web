"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { isGoBackEscape } from "./go-back-escape";
import { canReturnInApp } from "./in-app-history";

// Radix renders these only while open, in a portal.
const OPEN_OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], [role="menu"]';
const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/**
 * Returns a function that leaves the current page (FR-POST-07): back to the
 * previous in-app page, which keeps its scroll position, or to Home when the
 * page was opened directly, so the user never leaves the app.
 */
export function useGoBack(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (canReturnInApp()) router.back();
    else router.push("/");
  }, [router]);
}

/**
 * Calls `goBack` when the user presses Escape and nothing else wants the key
 * (see isGoBackEscape). The listener lives in an effect, so it is removed when
 * Next.js hides the page with Activity after navigating away.
 */
export function useEscapeToGoBack(goBack: () => void): void {
  useEffect(() => {
    // Bubble phase: when an open dialog or menu handles the key, Radix's
    // capture-phase listener has already called preventDefault.
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const shouldGoBack = isGoBackEscape({
        key: event.key,
        defaultPrevented: event.defaultPrevented,
        isComposing: event.isComposing,
        hasModifier: event.altKey || event.ctrlKey || event.metaKey || event.shiftKey,
        targetIsEditable: target instanceof Element && target.closest(EDITABLE_SELECTOR) !== null,
        overlayOpen: document.querySelector(OPEN_OVERLAY_SELECTOR) !== null,
        isFullscreen: document.fullscreenElement !== null,
      });
      if (!shouldGoBack) return;
      event.preventDefault();
      goBack();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack]);
}
