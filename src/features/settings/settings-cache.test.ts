import { describe, expect, it } from "vitest";

import type { User } from "@/lib/api/types";

import {
  acceptSetting,
  applySetting,
  rollbackSetting,
  settingUpdateBody,
  type SettingChange,
} from "./settings-cache";

const user: User = {
  id: "u1",
  email: "a@example.com",
  username: "a",
  displayName: "A",
  bio: null,
  avatarUrl: null,
  notificationsEnabled: true,
  language: "en",
  createdAt: "2026-11-08T10:00:00.000Z",
};

const turnOff: SettingChange = { field: "notificationsEnabled", value: false };
const toSinhala: SettingChange = { field: "language", value: "si" };

describe("settingUpdateBody", () => {
  it("sends only the changed field", () => {
    expect(settingUpdateBody(turnOff)).toEqual({ notificationsEnabled: false });
    expect(settingUpdateBody(toSinhala)).toEqual({ language: "si" });
  });
});

describe("applySetting", () => {
  it("changes only that field", () => {
    expect(applySetting(user, toSinhala)).toEqual({ ...user, language: "si" });
  });

  it("returns the same user when nothing changes", () => {
    expect(applySetting(user, { field: "language", value: "en" })).toBe(user);
  });
});

describe("rollbackSetting", () => {
  it("restores the previous value and keeps other changes", () => {
    const changed = { ...user, notificationsEnabled: false, language: "si" };
    expect(rollbackSetting(changed, turnOff, true)).toEqual({ ...user, language: "si" });
  });

  it("leaves a newer change to the same field alone", () => {
    const newer = { ...user, language: "en" };
    expect(rollbackSetting(newer, toSinhala, "en")).toBe(newer);
  });
});

describe("acceptSetting", () => {
  it("returns the same user when the server agrees", () => {
    const optimistic = applySetting(user, toSinhala);
    const saved = { ...user, language: "si", displayName: "Server name" };
    expect(acceptSetting(optimistic, toSinhala, saved)).toBe(optimistic);
  });

  it("keeps a newer change that is showing", () => {
    const newer = { ...user, notificationsEnabled: true };
    expect(acceptSetting(newer, turnOff, { ...user, notificationsEnabled: false })).toBe(newer);
  });

  it("leaves the other fields as cached", () => {
    const optimistic = applySetting(user, turnOff);
    const saved = { ...user, notificationsEnabled: false, displayName: "Server name" };
    expect(acceptSetting(optimistic, turnOff, saved).displayName).toBe("A");
  });
});
