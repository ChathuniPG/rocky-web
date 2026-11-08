/*
 * Decides which feed or post-page video may play (FR-FEED-09). Plain
 * TypeScript with no DOM access, so it can be unit-tested; the
 * useVideoAutoplay hook feeds it visibility ratios from an
 * IntersectionObserver and the page's visibility state.
 */

/** A video must be at least this visible (0..1) to autoplay. */
export const AUTOPLAY_VISIBILITY = 0.6;

/** What the coordinator can ask a registered video to do. */
export type CoordinatedVideo = {
  play: () => void;
  pause: () => void;
};

/** One shared "who plays" referee for all videos on the page. */
export type VideoCoordinator = {
  /** Adds a video; returns a function that removes it (and pauses it if it was playing). */
  register: (id: string, video: CoordinatedVideo) => () => void;
  /** Records how much of a video is visible, 0 to 1. */
  setVisibility: (id: string, ratio: number) => void;
  /** Whether the browser tab is visible; nothing plays while it is hidden. */
  setPageVisible: (visible: boolean) => void;
  /**
   * Pauses every video and stops autoplay until the returned release function
   * is called, e.g. while a modal dialog is open. Suspensions nest: playback
   * resumes only when every one of them has been released. Calling a release
   * function again does nothing.
   */
  suspend: () => () => void;
  /** A user started this video by hand: it becomes the active one and the others pause. */
  claim: (id: string) => void;
  /** The id of the video allowed to play, if any. */
  activeId: () => string | null;
  /**
   * Calls `listener` whenever the active video changes; returns a function
   * that stops it. Lets a player re-render when it becomes active, e.g. to
   * start buffering (NFR-PERF-03).
   */
  subscribe: (listener: () => void) => () => void;
};

type Entry = { video: CoordinatedVideo; ratio: number };

/**
 * Creates a coordinator. The most visible registered video (at least
 * AUTOPLAY_VISIBILITY; on a tie the playing one stays, otherwise the one
 * registered first) is active;
 * when that changes, the old one is paused and the new one is played, so at
 * most one video plays at a time.
 */
export function createVideoCoordinator(): VideoCoordinator {
  // A Map keeps insertion order, which settles ties between videos that aren't playing.
  const entries = new Map<string, Entry>();
  let pageVisible = true;
  let active: string | null = null;
  // A count, not a flag, so a dialog opened from another dialog doesn't resume playback when it closes.
  let suspensions = 0;
  const listeners = new Set<() => void>();

  function setActive(next: string | null): void {
    if (next === active) return;
    active = next;
    for (const listener of listeners) listener();
  }

  function mostVisibleId(): string | null {
    if (!pageVisible || suspensions > 0) return null;
    // The playing video wins ties, so two equally visible videos don't keep swapping.
    const current = active === null ? undefined : entries.get(active);
    let bestId: string | null = current && current.ratio >= AUTOPLAY_VISIBILITY ? active : null;
    let bestRatio = current && bestId !== null ? current.ratio : AUTOPLAY_VISIBILITY;
    for (const [id, entry] of entries) {
      if (entry.ratio >= bestRatio && (bestId === null || entry.ratio > bestRatio)) {
        bestId = id;
        bestRatio = entry.ratio;
      }
    }
    return bestId;
  }

  function activate(next: string | null): void {
    if (next === active) return;
    const previous = active === null ? undefined : entries.get(active);
    setActive(next);
    previous?.video.pause();
    if (next !== null) entries.get(next)?.video.play();
  }

  return {
    register(id, video) {
      entries.set(id, { video, ratio: 0 });
      return () => {
        const entry = entries.get(id);
        if (!entry || entry.video !== video) return;
        entries.delete(id);
        if (active === id) {
          setActive(null);
          video.pause();
          activate(mostVisibleId());
        }
      };
    },
    setVisibility(id, ratio) {
      const entry = entries.get(id);
      if (!entry) return;
      entry.ratio = ratio;
      activate(mostVisibleId());
    },
    setPageVisible(visible) {
      pageVisible = visible;
      activate(mostVisibleId());
    },
    suspend() {
      suspensions += 1;
      activate(null);
      let released = false;
      return () => {
        // Effect cleanups can run more than once (StrictMode, Activity); release only once.
        if (released) return;
        released = true;
        suspensions -= 1;
        activate(mostVisibleId());
      };
    },
    claim(id) {
      if (!entries.has(id)) return;
      const previous = active === null || active === id ? undefined : entries.get(active);
      setActive(id);
      previous?.video.pause();
    },
    activeId: () => active,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** The coordinator shared by every video in the app. */
export const videoCoordinator = createVideoCoordinator();
