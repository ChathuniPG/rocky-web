import type { InfiniteData } from "@tanstack/react-query";

import type {
  Conversation,
  ConversationPage,
  Message,
  MessagePage,
  UnreadConversationsCount,
} from "@/lib/api/types";

/*
 * Pure updates of cached conversations and messages (FR-MSG-01..05). Each
 * returns the same reference when nothing changes, so unrelated components
 * don't re-render.
 */

/** A thread's cached history: pages newest first, each page's items newest first. */
export type MessagePages = InfiniteData<MessagePage, unknown>;

/** The cached conversation list, latest activity first. */
export type ConversationPages = InfiniteData<ConversationPage, unknown>;

/** The history in reading order: oldest first, newest last. */
export function chronologicalMessages(data: MessagePages): Message[] {
  return data.pages.flatMap((page) => page.items).reverse();
}

/** The newest cached message's id, used as the polling `after` parameter. */
export function newestMessageId(data: MessagePages): string | undefined {
  return data.pages[0]?.items[0]?.id;
}

/**
 * Adds messages that are newer than the cache (oldest first, as polling
 * returns them) to the top of the newest page. Messages already cached are
 * skipped, so a message seen by both a poll and a send appears once.
 */
export function mergeNewMessages(data: MessagePages, incoming: readonly Message[]): MessagePages {
  const known = new Set(data.pages.flatMap((page) => page.items.map((message) => message.id)));
  const fresh: Message[] = [];
  for (const message of incoming) {
    if (known.has(message.id)) continue;
    known.add(message.id);
    fresh.push(message);
  }
  if (fresh.length === 0) return data;

  const [first, ...rest] = data.pages;
  const newestFirst = fresh.reverse();
  const firstPage: MessagePage = first
    ? { ...first, items: [...newestFirst, ...first.items] }
    : { items: newestFirst, nextCursor: null };
  return { ...data, pages: [firstPage, ...rest] };
}

/** The conversation with this id among the cached list pages, if any. */
export function findConversationInPages(
  data: ConversationPages,
  conversationId: string,
): Conversation | undefined {
  for (const page of data.pages) {
    const match = page.items.find((conversation) => conversation.id === conversationId);
    if (match) return match;
  }
  return undefined;
}

/** Whether the cached list shows this conversation with unread messages. */
export function isConversationUnreadInPages(
  data: ConversationPages,
  conversationId: string,
): boolean {
  const conversation = findConversationInPages(data, conversationId);
  return conversation !== undefined && conversation.unreadCount > 0;
}

/**
 * Lowers the navigation badge's count (FR-MSG-06), never below zero. Returns
 * the same reference when the count doesn't change.
 */
export function decrementUnreadConversationCount(
  data: UnreadConversationsCount,
  amount = 1,
): UnreadConversationsCount {
  const count = Math.max(0, data.count - amount);
  return count === data.count ? data : { count };
}

/** Sets a conversation's unread count to zero after it was read (FR-MSG-05). */
export function markConversationReadInPages(
  data: ConversationPages,
  conversationId: string,
): ConversationPages {
  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((item) => item.id === conversationId && item.unreadCount > 0)) {
      return page;
    }
    changed = true;
    return {
      ...page,
      items: page.items.map((item) =>
        item.id === conversationId ? { ...item, unreadCount: 0 } : item,
      ),
    };
  });
  return changed ? { ...data, pages } : data;
}

/**
 * Makes `message` the conversation's last message and moves the conversation
 * to the top of the list, which is sorted by latest activity. An older message
 * than the cached last one changes nothing. Returns the same data when the
 * conversation isn't cached; the list then picks it up on its next fetch.
 */
export function applyLastMessageToPages(
  data: ConversationPages,
  message: Message,
): ConversationPages {
  const current = findConversationInPages(data, message.conversationId);
  if (!current) return data;
  if (current.lastMessage && current.lastMessage.createdAt >= message.createdAt) return data;

  const updated: Conversation = {
    ...current,
    lastMessage: {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      createdAt: message.createdAt,
    },
    lastMessageAt: message.createdAt,
  };
  const pages = data.pages.map((page, index) => {
    const items = page.items.filter((item) => item.id !== message.conversationId);
    return index === 0 ? { ...page, items: [updated, ...items] } : { ...page, items };
  });
  return { ...data, pages };
}
