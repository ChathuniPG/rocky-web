// Sub-pixel differences (zoom, snap rounding) are not worth a scroll.
const RESTORE_TOLERANCE_PX = 1;

/**
 * Where to scroll the page to bring back the feed's saved position
 * (FR-POST-07): the saved scroll offset, or null when nothing is saved or the
 * page is already there.
 */
export function feedScrollRestoreTarget(saved: number | null, current: number): number | null {
  if (saved === null) return null;
  return Math.abs(current - saved) > RESTORE_TOLERANCE_PX ? saved : null;
}
