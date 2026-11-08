"use client";

import { useSyncExternalStore } from "react";

import { allowsLookAhead, type ConnectionHints } from "./video-preload";

/**
 * navigator.connection (Network Information API), feature-detected: it is
 * only available in Chromium-based browsers and isn't in TypeScript's DOM types.
 */
function readConnection(): EventTarget | undefined {
  const connection: unknown = Reflect.get(navigator, "connection");
  return connection instanceof EventTarget ? connection : undefined;
}

function readHints(): ConnectionHints | undefined {
  const connection = readConnection();
  if (!connection) return undefined;
  return {
    saveData: Reflect.get(connection, "saveData"),
    effectiveType: Reflect.get(connection, "effectiveType"),
  };
}

// The connection fires `change` when Data Saver or the effective type changes.
function subscribe(onChange: () => void): () => void {
  const connection = readConnection();
  connection?.addEventListener("change", onChange);
  return () => connection?.removeEventListener("change", onChange);
}

/**
 * Whether the feed may buffer a video before the viewer reaches it
 * (NFR-PERF-03): false with Data Saver on or on a 2G-or-slower connection.
 * Re-read on the connection's `change` event and on every render, because
 * not every way of toggling Data Saver fires the event (e.g. the DevTools
 * override). False during server rendering.
 */
export function useLookAheadAllowed(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => allowsLookAhead(readHints()),
    () => false,
  );
}
