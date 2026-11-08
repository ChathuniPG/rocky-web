import { describe, expect, it } from "vitest";

import type { Conversation, Message } from "@/lib/api/types";

import {
  applyLastMessageToPages,
  chronologicalMessages,
  decrementUnreadConversationCount,
  findConversationInPages,
  isConversationUnreadInPages,
  markConversationReadInPages,
  mergeNewMessages,
  newestMessageId,
  type ConversationPages,
  type MessagePages,
} from "./message-cache";

function makeMessage(id: string, minute: number, conversationId = "conv-1"): Message {
  return {
    id,
    conversationId,
    senderId: "other",
    body: `Message ${id}`,
    readAt: null,
    createdAt: `2026-11-08T10:${String(minute).padStart(2, "0")}:00.000Z`,
  };
}

/** Pages newest first, items newest first, like the API returns them. */
function makeHistory(...pages: Message[][]): MessagePages {
  return {
    pages: pages.map((items, index) => ({
      items,
      nextCursor: index < pages.length - 1 ? `c${index}` : null,
    })),
    pageParams: pages.map((_, index) => (index === 0 ? undefined : `c${index - 1}`)),
  };
}

function makeConversation(id: string, overrides: Partial<Conversation> = {}): Conversation {
  return {
    id,
    otherUser: {
      id: `user-${id}`,
      username: `u_${id}`,
      displayName: `User ${id}`,
      avatarUrl: null,
    },
    lastMessage: null,
    unreadCount: 0,
    lastMessageAt: "2026-11-08T09:00:00.000Z",
    ...overrides,
  };
}

function makeList(...pages: Conversation[][]): ConversationPages {
  return {
    pages: pages.map((items) => ({ items, nextCursor: null })),
    pageParams: pages.map(() => undefined),
  };
}

describe("chronologicalMessages and newestMessageId", () => {
  it("orders the history oldest first and finds the newest id", () => {
    const history = makeHistory(
      [makeMessage("m4", 4), makeMessage("m3", 3)],
      [makeMessage("m2", 2), makeMessage("m1", 1)],
    );
    expect(chronologicalMessages(history).map((message) => message.id)).toEqual([
      "m1",
      "m2",
      "m3",
      "m4",
    ]);
    expect(newestMessageId(history)).toBe("m4");
  });

  it("has no newest id for an empty conversation", () => {
    expect(newestMessageId(makeHistory([]))).toBeUndefined();
  });
});

describe("mergeNewMessages", () => {
  it("adds polled messages (oldest first) to the top of the newest page", () => {
    const history = makeHistory([makeMessage("m2", 2), makeMessage("m1", 1)]);
    const next = mergeNewMessages(history, [makeMessage("m3", 3), makeMessage("m4", 4)]);
    expect(chronologicalMessages(next).map((message) => message.id)).toEqual([
      "m1",
      "m2",
      "m3",
      "m4",
    ]);
  });

  it("skips messages that are already cached or repeated", () => {
    const history = makeHistory([makeMessage("m2", 2), makeMessage("m1", 1)]);
    const next = mergeNewMessages(history, [
      makeMessage("m2", 2),
      makeMessage("m3", 3),
      makeMessage("m3", 3),
    ]);
    expect(chronologicalMessages(next).map((message) => message.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("returns the same data when nothing is new", () => {
    const history = makeHistory([makeMessage("m1", 1)]);
    expect(mergeNewMessages(history, [makeMessage("m1", 1)])).toBe(history);
    expect(mergeNewMessages(history, [])).toBe(history);
  });

  it("creates a first page when the history has none", () => {
    const empty: MessagePages = { pages: [], pageParams: [] };
    const next = mergeNewMessages(empty, [makeMessage("m1", 1)]);
    expect(newestMessageId(next)).toBe("m1");
  });
});

describe("findConversationInPages and markConversationReadInPages", () => {
  it("finds a conversation on any page", () => {
    const list = makeList([makeConversation("a")], [makeConversation("b")]);
    expect(findConversationInPages(list, "b")?.id).toBe("b");
    expect(findConversationInPages(list, "missing")).toBeUndefined();
  });

  it("clears only that conversation's unread count", () => {
    const list = makeList([
      makeConversation("a", { unreadCount: 2 }),
      makeConversation("b", { unreadCount: 1 }),
    ]);
    const next = markConversationReadInPages(list, "a");
    expect(next.pages[0]?.items.map((item) => item.unreadCount)).toEqual([0, 1]);
  });

  it("returns the same data when the conversation is already read or missing", () => {
    const list = makeList([makeConversation("a")]);
    expect(markConversationReadInPages(list, "a")).toBe(list);
    expect(markConversationReadInPages(list, "missing")).toBe(list);
  });
});

describe("isConversationUnreadInPages", () => {
  it("is true only for a cached conversation with unread messages", () => {
    const list = makeList(
      [makeConversation("a", { unreadCount: 2 })],
      [makeConversation("b"), makeConversation("c", { unreadCount: 1 })],
    );
    expect(isConversationUnreadInPages(list, "a")).toBe(true);
    expect(isConversationUnreadInPages(list, "c")).toBe(true);
    expect(isConversationUnreadInPages(list, "b")).toBe(false);
    expect(isConversationUnreadInPages(list, "missing")).toBe(false);
  });
});

describe("decrementUnreadConversationCount", () => {
  it("lowers the count by one or by the given amount", () => {
    expect(decrementUnreadConversationCount({ count: 3 })).toEqual({ count: 2 });
    expect(decrementUnreadConversationCount({ count: 3 }, 2)).toEqual({ count: 1 });
  });

  it("never goes below zero and keeps the reference when nothing changes", () => {
    const zero = { count: 0 };
    expect(decrementUnreadConversationCount(zero)).toBe(zero);
    expect(decrementUnreadConversationCount({ count: 1 }, 5)).toEqual({ count: 0 });
  });
});

describe("applyLastMessageToPages", () => {
  it("updates the last message and moves the conversation to the top", () => {
    const list = makeList([makeConversation("a"), makeConversation("b")], [makeConversation("c")]);
    const message = makeMessage("m9", 30, "c");
    const next = applyLastMessageToPages(list, message);

    expect(next.pages[0]?.items.map((item) => item.id)).toEqual(["c", "a", "b"]);
    expect(next.pages[1]?.items).toEqual([]);
    expect(next.pages[0]?.items[0]?.lastMessage?.id).toBe("m9");
    expect(next.pages[0]?.items[0]?.lastMessageAt).toBe(message.createdAt);
  });

  it("ignores a message older than the cached last message", () => {
    const newer = makeMessage("m5", 5, "a");
    const list = makeList([
      makeConversation("a", {
        lastMessage: { id: "m5", body: newer.body, senderId: "other", createdAt: newer.createdAt },
      }),
    ]);
    expect(applyLastMessageToPages(list, makeMessage("m4", 4, "a"))).toBe(list);
  });

  it("returns the same data when the conversation isn't cached", () => {
    const list = makeList([makeConversation("a")]);
    expect(applyLastMessageToPages(list, makeMessage("m1", 1, "zzz"))).toBe(list);
  });
});
