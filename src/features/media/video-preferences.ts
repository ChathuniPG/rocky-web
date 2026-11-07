import { z } from "zod";

/*
 * The viewer's sound preference and the player's number rules (FR-FEED-09).
 * The preference lives in sessionStorage, so it is shared by every video in
 * the tab and forgotten when the tab closes, and in a small in-memory store
 * that lets all mounted players react when one of them changes it.
 */

/** Whether videos play muted, and at what volume (0..1) when they don't. */
export type SoundPreference = { muted: boolean; volume: number };

/** Videos start muted so they never make sound unasked. */
export const DEFAULT_SOUND_PREFERENCE: SoundPreference = { muted: true, volume: 1 };

/** How far the arrow keys move the playhead, in seconds. */
export const SEEK_STEP_SECONDS = 5;
/** How far the arrow keys change the volume. */
export const VOLUME_STEP = 0.1;

const STORAGE_KEY = "rocky.video-sound";

const soundPreferenceSchema = z.object({
  muted: z.boolean(),
  volume: z.number().min(0).max(1),
});

/** The minimal part of the Web Storage API used here, so tests can pass a fake. */
export type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

/** Parses a stored preference, falling back to the default for anything missing or invalid. */
export function parseSoundPreference(raw: string | null): SoundPreference {
  if (raw === null) return DEFAULT_SOUND_PREFERENCE;
  try {
    const result = soundPreferenceSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : DEFAULT_SOUND_PREFERENCE;
  } catch {
    return DEFAULT_SOUND_PREFERENCE;
  }
}

/** Reads the preference; storage can be missing or throw (private mode, blocked site data). */
export function readSoundPreference(storage: () => PreferenceStorage | undefined): SoundPreference {
  try {
    return parseSoundPreference(storage()?.getItem(STORAGE_KEY) ?? null);
  } catch {
    return DEFAULT_SOUND_PREFERENCE;
  }
}

/** Stores the preference; failures are ignored, the in-memory value still applies to this page. */
export function writeSoundPreference(
  storage: () => PreferenceStorage | undefined,
  preference: SoundPreference,
): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch {
    // Storage is a convenience: without it the preference lasts until reload.
  }
}

/** Clamps a playhead position to the video's length; 0 while the length is unknown. */
export function clampSeekTime(time: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(time)) return 0;
  return Math.min(Math.max(time, 0), duration);
}

/** The playhead moved by `delta` seconds, kept inside the video. */
export function seekBy(current: number, delta: number, duration: number): number {
  return clampSeekTime(current + delta, duration);
}

/** The volume moved by `delta`, kept within 0..1 and rounded to one decimal so steps don't drift. */
export function stepVolume(volume: number, delta: number): number {
  return Math.round(Math.min(Math.max(volume + delta, 0), 1) * 10) / 10;
}

/**
 * The preference after the user changed the volume: a volume of 0 means muted,
 * and raising it from 0 or while muted turns sound on.
 */
export function withVolume(preference: SoundPreference, volume: number): SoundPreference {
  if (volume <= 0) return { muted: true, volume: preference.volume > 0 ? preference.volume : 1 };
  return { muted: false, volume };
}

/** The preference with sound toggled; unmuting at volume 0 restores full volume. */
export function withMuteToggled(preference: SoundPreference): SoundPreference {
  if (!preference.muted) return { ...preference, muted: true };
  return { muted: false, volume: preference.volume > 0 ? preference.volume : 1 };
}

/** Formats seconds as m:ss (or h:mm:ss), for the progress slider's spoken value. */
export function formatMediaTime(seconds: number): string {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}` : `${minutes}:${secs}`;
}

/** A tiny external store for the preference, read with useSyncExternalStore. */
export type SoundPreferenceStore = {
  get: () => SoundPreference;
  set: (preference: SoundPreference) => void;
  subscribe: (listener: () => void) => () => void;
};

/** Creates a store backed by the given storage, loaded lazily on first read. */
export function createSoundPreferenceStore(
  storage: () => PreferenceStorage | undefined,
): SoundPreferenceStore {
  let current: SoundPreference | null = null;
  const listeners = new Set<() => void>();

  return {
    get() {
      current ??= readSoundPreference(storage);
      return current;
    },
    set(preference) {
      current = preference;
      writeSoundPreference(storage, preference);
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** The app-wide store, backed by sessionStorage in the browser. */
export const soundPreferenceStore = createSoundPreferenceStore(() =>
  typeof window === "undefined" ? undefined : window.sessionStorage,
);
