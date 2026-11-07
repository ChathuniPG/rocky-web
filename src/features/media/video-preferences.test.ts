import { describe, expect, it } from "vitest";

import {
  DEFAULT_SOUND_PREFERENCE,
  clampSeekTime,
  createSoundPreferenceStore,
  formatMediaTime,
  parseSoundPreference,
  readSoundPreference,
  seekBy,
  stepVolume,
  withMuteToggled,
  withVolume,
  writeSoundPreference,
  type PreferenceStorage,
} from "./video-preferences";

/** An in-memory stand-in for sessionStorage. */
function memoryStorage(): PreferenceStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const throwingStorage: PreferenceStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
};

describe("sound preference", () => {
  it("starts muted by default", () => {
    expect(DEFAULT_SOUND_PREFERENCE.muted).toBe(true);
    expect(parseSoundPreference(null)).toEqual(DEFAULT_SOUND_PREFERENCE);
  });

  it("falls back to the default for invalid stored values", () => {
    expect(parseSoundPreference("not json")).toEqual(DEFAULT_SOUND_PREFERENCE);
    expect(parseSoundPreference('{"muted":"no","volume":1}')).toEqual(DEFAULT_SOUND_PREFERENCE);
    expect(parseSoundPreference('{"muted":false,"volume":3}')).toEqual(DEFAULT_SOUND_PREFERENCE);
  });

  it("round-trips through storage", () => {
    const storage = memoryStorage();
    writeSoundPreference(() => storage, { muted: false, volume: 0.4 });
    expect(readSoundPreference(() => storage)).toEqual({ muted: false, volume: 0.4 });
  });

  it("survives storage that is missing or throws", () => {
    expect(readSoundPreference(() => undefined)).toEqual(DEFAULT_SOUND_PREFERENCE);
    expect(readSoundPreference(() => throwingStorage)).toEqual(DEFAULT_SOUND_PREFERENCE);
    expect(() =>
      writeSoundPreference(() => throwingStorage, DEFAULT_SOUND_PREFERENCE),
    ).not.toThrow();
  });

  it("shares one value between subscribers and keeps it when storage fails", () => {
    const store = createSoundPreferenceStore(() => throwingStorage);
    let notified = 0;
    store.subscribe(() => notified++);
    store.set({ muted: false, volume: 0.5 });
    expect(store.get()).toEqual({ muted: false, volume: 0.5 });
    expect(notified).toBe(1);
  });

  it("toggles mute, restoring full volume when unmuting at zero", () => {
    expect(withMuteToggled({ muted: true, volume: 0.3 })).toEqual({ muted: false, volume: 0.3 });
    expect(withMuteToggled({ muted: false, volume: 0.3 })).toEqual({ muted: true, volume: 0.3 });
    expect(withMuteToggled({ muted: true, volume: 0 })).toEqual({ muted: false, volume: 1 });
  });

  it("treats volume 0 as muted and a raised volume as unmuted", () => {
    expect(withVolume({ muted: false, volume: 0.5 }, 0)).toEqual({ muted: true, volume: 0.5 });
    expect(withVolume({ muted: true, volume: 0.5 }, 0.6)).toEqual({ muted: false, volume: 0.6 });
  });
});

describe("seeking", () => {
  it("clamps to the start and end of the video", () => {
    expect(clampSeekTime(-3, 30)).toBe(0);
    expect(clampSeekTime(12, 30)).toBe(12);
    expect(clampSeekTime(45, 30)).toBe(30);
  });

  it("returns 0 while the length is unknown", () => {
    expect(clampSeekTime(10, Number.NaN)).toBe(0);
    expect(clampSeekTime(10, 0)).toBe(0);
    expect(clampSeekTime(Number.NaN, 30)).toBe(0);
  });

  it("seeks by a step within the video", () => {
    expect(seekBy(2, -5, 30)).toBe(0);
    expect(seekBy(10, 5, 30)).toBe(15);
    expect(seekBy(28, 5, 30)).toBe(30);
  });
});

describe("stepVolume", () => {
  it("moves in steps of 0.1 without floating-point drift", () => {
    expect(stepVolume(0.7, 0.1)).toBe(0.8);
    expect(stepVolume(0.3, -0.1)).toBe(0.2);
    let volume = 0;
    for (let i = 0; i < 7; i++) volume = stepVolume(volume, 0.1);
    expect(volume).toBe(0.7);
  });

  it("stays within 0 and 1", () => {
    expect(stepVolume(0.95, 0.1)).toBe(1);
    expect(stepVolume(0.05, -0.1)).toBe(0);
  });
});

describe("formatMediaTime", () => {
  it("formats minutes and hours", () => {
    expect(formatMediaTime(0)).toBe("0:00");
    expect(formatMediaTime(72.9)).toBe("1:12");
    expect(formatMediaTime(3725)).toBe("1:02:05");
    expect(formatMediaTime(Number.NaN)).toBe("0:00");
  });
});
