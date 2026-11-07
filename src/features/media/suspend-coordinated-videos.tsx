"use client";

import { useEffect } from "react";

import { videoCoordinator } from "./video-coordinator";

/**
 * Pauses all coordinated feed and post videos, and suspends their autoplay,
 * for as long as it is mounted. When the last suspension ends, the most
 * visible video plays again. Renders nothing.
 *
 * The shared Dialog and AlertDialog render it inside their overlay, which
 * Radix mounts only while a modal dialog is open (and during its close
 * animation), so every dialog is covered without code of its own. Videos that
 * don't register with the coordinator, such as the native upload preview,
 * are unaffected.
 *
 * Known limit: a coordinated VideoPlayer rendered inside a dialog would be
 * paused as well, since the coordinator can't tell it apart from the videos
 * behind the dialog. No dialog shows one today.
 */
export function SuspendCoordinatedVideos() {
  // Cleanup also runs when Next.js hides the page (React Activity), so a dialog
  // left open on a hidden page never blocks videos on the visible one.
  useEffect(() => videoCoordinator.suspend(), []);
  return null;
}
