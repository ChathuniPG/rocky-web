/**
 * The index of the most visible item, given each item's visible ratio (0..1);
 * the first one wins a tie. Null when nothing is visible at all.
 */
export function mostVisibleIndex(ratios: readonly number[]): number | null {
  let best: number | null = null;
  let bestRatio = 0;
  ratios.forEach((ratio, index) => {
    if (ratio > bestRatio) {
      best = index;
      bestRatio = ratio;
    }
  });
  return best;
}
