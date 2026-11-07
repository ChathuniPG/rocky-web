/*
 * Layout classes shared by FeedPost and FeedPostSkeleton, so loading doesn't
 * shift the layout (FR-FEED-10). A plain module, not a client one, so server
 * components can import the strings too.
 */

/** The feed's sticky header height; matches `scroll-padding-top` in globals.css. */
export const feedHeaderClasses = "h-14";

/** One snap point per post: the viewport below the header, with a floor for very short windows. */
export const feedItemClasses =
  "h-[calc(100dvh-3.5rem)] min-h-[30rem] snap-start snap-always px-4 py-4";

/** The article: media and actions side by side from 768px, stacked below that. */
export const feedPostLayoutClasses =
  "flex h-full min-h-0 flex-col items-center justify-center gap-3 md:flex-row md:items-end md:gap-5";

/**
 * The 9:16 media frame at the full available height. Below 768px it leaves room
 * for the action row; max-w-* keeps it from pushing the actions off screen in
 * narrow windows (it then letterboxes, as the media is never cropped).
 */
export const feedMediaFrameClasses =
  "relative aspect-9/16 h-[calc(100%-5.5rem)] max-w-full overflow-hidden rounded-xl md:h-full md:max-w-[calc(100%-6rem)]";
