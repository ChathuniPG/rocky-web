import { describe, expect, it } from "vitest";

import {
  queueToastAfterReload,
  takeToastAfterReload,
  type ToastStorage,
} from "./toast-after-reload";

function memoryStorage(): ToastStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
    removeItem: (key) => void items.delete(key),
  };
}

function throwingStorage(): ToastStorage {
  const fail = () => {
    throw new DOMException("blocked", "SecurityError");
  };
  return { getItem: fail, setItem: fail, removeItem: fail };
}

describe("toast after reload", () => {
  it("returns the queued message once", () => {
    const storage = memoryStorage();
    queueToastAfterReload("Welcome back, Alice!", storage);
    expect(takeToastAfterReload(storage)).toBe("Welcome back, Alice!");
    expect(takeToastAfterReload(storage)).toBeNull();
  });

  it("keeps only the latest message", () => {
    const storage = memoryStorage();
    queueToastAfterReload("first", storage);
    queueToastAfterReload("second", storage);
    expect(takeToastAfterReload(storage)).toBe("second");
  });

  it("returns null when nothing is queued", () => {
    expect(takeToastAfterReload(memoryStorage())).toBeNull();
  });

  it("ignores blocked or missing storage", () => {
    expect(() => queueToastAfterReload("hi", throwingStorage())).not.toThrow();
    expect(takeToastAfterReload(throwingStorage())).toBeNull();
    expect(() => queueToastAfterReload("hi", undefined)).not.toThrow();
    expect(takeToastAfterReload(undefined)).toBeNull();
  });
});
