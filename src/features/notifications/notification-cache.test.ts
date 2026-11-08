import { describe, expect, it } from "vitest";

import type { Notification } from "@/lib/api/types";

import {
  decrementUnreadCount,
  isUnreadInPages,
  markAllReadInPages,
  markNotificationReadInPages,
  type NotificationPages,
} from "./notification-cache";

function makeNotification(id: string, isRead = false): Notification {
  return {
    id,
    type: "FOLLOW",
    isRead,
    createdAt: "2026-11-08T10:00:00.000Z",
    actor: { id: "actor", username: "ada", displayName: "Ada", avatarUrl: null },
    post: null,
    comment: null,
  };
}

function makePages(...pages: Notification[][]): NotificationPages {
  return {
    pages: pages.map((items, index) => ({
      items,
      nextCursor: index < pages.length - 1 ? `c${index}` : null,
    })),
    pageParams: pages.map((_, index) => (index === 0 ? undefined : `c${index - 1}`)),
  };
}

describe("markNotificationReadInPages", () => {
  it("marks only the matching notification and keeps other pages as they were", () => {
    const data = makePages([makeNotification("a"), makeNotification("b")], [makeNotification("c")]);
    const next = markNotificationReadInPages(data, "b");

    expect(next.pages[0]?.items.map((item) => item.isRead)).toEqual([false, true]);
    expect(next.pages[1]).toBe(data.pages[1]);
  });

  it("returns the same data when the notification is missing or already read", () => {
    const data = makePages([makeNotification("a", true)]);
    expect(markNotificationReadInPages(data, "a")).toBe(data);
    expect(markNotificationReadInPages(data, "missing")).toBe(data);
  });
});

describe("markAllReadInPages", () => {
  it("marks every notification and keeps fully read pages as they were", () => {
    const data = makePages(
      [makeNotification("a"), makeNotification("b", true)],
      [makeNotification("c", true)],
    );
    const next = markAllReadInPages(data);

    expect(next.pages.flatMap((page) => page.items).every((item) => item.isRead)).toBe(true);
    expect(next.pages[1]).toBe(data.pages[1]);
  });

  it("returns the same data when everything is read", () => {
    const data = makePages([makeNotification("a", true)]);
    expect(markAllReadInPages(data)).toBe(data);
  });
});

describe("isUnreadInPages", () => {
  it("is true only for a cached unread notification", () => {
    const data = makePages([makeNotification("a"), makeNotification("b", true)]);
    expect(isUnreadInPages(data, "a")).toBe(true);
    expect(isUnreadInPages(data, "b")).toBe(false);
    expect(isUnreadInPages(data, "missing")).toBe(false);
  });
});

describe("decrementUnreadCount", () => {
  it("lowers the count", () => {
    expect(decrementUnreadCount({ count: 3 })).toEqual({ count: 2 });
    expect(decrementUnreadCount({ count: 3 }, 2)).toEqual({ count: 1 });
  });

  it("never goes below zero and keeps the reference when unchanged", () => {
    const zero = { count: 0 };
    expect(decrementUnreadCount(zero)).toBe(zero);
    expect(decrementUnreadCount({ count: 1 }, 5)).toEqual({ count: 0 });
  });
});
