import { describe, expect, it } from "vitest";

import type { Notification } from "@/lib/api/types";

import { notificationHref, notificationMessageKey } from "./notification-content";

const actor = { id: "actor", username: "ada lovelace", displayName: "Ada", avatarUrl: null };
const post = { id: "post-1", mediaUrl: "https://example.com/p.jpg", mediaType: "IMAGE" as const };

function makeNotification(overrides: Partial<Notification>): Notification {
  return {
    id: "n1",
    type: "LIKE",
    isRead: false,
    createdAt: "2026-11-08T10:00:00.000Z",
    actor,
    post,
    comment: null,
    ...overrides,
  };
}

describe("notificationHref", () => {
  it("opens the post for likes and comments", () => {
    expect(notificationHref(makeNotification({ type: "LIKE" }))).toBe("/posts/post-1");
    expect(
      notificationHref(makeNotification({ type: "COMMENT", comment: { id: "c1", body: "Hi" } })),
    ).toBe("/posts/post-1");
  });

  it("opens the actor's profile for follows, encoding the username", () => {
    expect(notificationHref(makeNotification({ type: "FOLLOW", post: null }))).toBe(
      "/u/ada%20lovelace",
    );
  });

  it("falls back to the actor's profile when a like has no post", () => {
    expect(notificationHref(makeNotification({ type: "LIKE", post: null }))).toBe(
      "/u/ada%20lovelace",
    );
  });
});

describe("notificationMessageKey", () => {
  it("has a sentence for every type", () => {
    expect(notificationMessageKey("LIKE")).toBe("notifications.item.like");
    expect(notificationMessageKey("COMMENT")).toBe("notifications.item.comment");
    expect(notificationMessageKey("FOLLOW")).toBe("notifications.item.follow");
  });
});
