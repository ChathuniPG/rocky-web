import { describe, expect, it } from "vitest";

import { formatAbsoluteDateTime, formatRelativeTime } from "./relative-time";

const now = new Date("2026-11-07T12:00:00.000Z");

function ago(ms: number): Date {
  return new Date(now.getTime() - ms);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it.each([
    [0, "now"],
    [30 * 1_000, "now"],
    [MINUTE, "1 minute ago"],
    [5 * MINUTE, "5 minutes ago"],
    [59 * MINUTE, "59 minutes ago"],
    [HOUR, "1 hour ago"],
    [23 * HOUR, "23 hours ago"],
    [DAY, "yesterday"],
    [3 * DAY, "3 days ago"],
    [7 * DAY, "last week"],
    [14 * DAY, "2 weeks ago"],
    [30 * DAY, "last month"],
    [90 * DAY, "3 months ago"],
    [365 * DAY, "last year"],
    [3 * 365 * DAY, "3 years ago"],
  ])("formats %i ms ago as %s", (ms, expected) => {
    expect(formatRelativeTime(ago(ms), now, "en")).toBe(expected);
  });

  it("accepts ISO strings, as the API returns them", () => {
    expect(formatRelativeTime("2026-11-07T11:55:00.000Z", now, "en")).toBe("5 minutes ago");
  });

  it("formats future dates (a clock running behind the server)", () => {
    expect(formatRelativeTime(new Date(now.getTime() + 2 * HOUR), now, "en")).toBe("in 2 hours");
  });

  it("formats in the requested locale", () => {
    const english = formatRelativeTime(ago(5 * MINUTE), now, "en");
    const sinhala = formatRelativeTime(ago(5 * MINUTE), now, "si");
    expect(sinhala).not.toBe(english);
    expect(sinhala).toMatch(/5/);
  });
});

describe("formatAbsoluteDateTime", () => {
  it("includes the date and the year", () => {
    expect(formatAbsoluteDateTime(now, "en")).toMatch(/November \d+, 2026/);
  });
});
