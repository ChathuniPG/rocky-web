/** Within this many pixels of the bottom, the reader counts as "at the latest message". */
export const NEAR_BOTTOM_PX = 120;

/** The scroll measurements of a scrollable element. */
export type ScrollMetrics = { scrollTop: number; scrollHeight: number; clientHeight: number };

/** How far the visible area's bottom edge is from the end of the content. */
export function distanceFromBottom({
  scrollTop,
  scrollHeight,
  clientHeight,
}: ScrollMetrics): number {
  return Math.max(0, scrollHeight - clientHeight - scrollTop);
}

/** Whether the reader is close enough to the bottom to follow new messages automatically. */
export function isNearBottom(metrics: ScrollMetrics, threshold = NEAR_BOTTOM_PX): boolean {
  return distanceFromBottom(metrics) <= threshold;
}

/**
 * The scrollTop that keeps the same content in view after older messages were
 * added above it: the distance from the bottom stays what it was before.
 */
export function scrollTopKeepingBottomDistance(
  savedDistanceFromBottom: number,
  { scrollHeight, clientHeight }: Omit<ScrollMetrics, "scrollTop">,
): number {
  return Math.max(0, scrollHeight - clientHeight - savedDistanceFromBottom);
}
