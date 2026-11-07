/*
 * Layout classes shared by PostDetail and PostDetailSkeleton (FR-POST-07). A
 * plain module, not a client one, so server components can import the strings.
 */

/** Two panes from 1024px (media left, comments right), each scrolling on its own; stacked below. */
export const postDetailGridClasses =
  "lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]";

/** The media pane: the full pane height from 1024px, most of the screen below. */
export const postMediaPaneClasses = "relative h-[70dvh] min-h-80 lg:h-full lg:min-h-0";

/** The comments panel next to (or below) the media. */
export const postPanelClasses = "flex flex-col bg-card lg:min-h-0 lg:border-l";
