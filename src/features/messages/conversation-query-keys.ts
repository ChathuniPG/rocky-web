/*
 * TanStack Query keys for conversations and messages. Only exact keys are
 * invalidated: a thread's history is kept up to date by polling and must
 * never be refetched wholesale, so nothing invalidates the ["conversations"]
 * prefix as a whole.
 */

/** Query keys for conversations and messages. */
export const conversationKeys = {
  /** Prefix of every conversation query. */
  all: ["conversations"] as const,
  /** The conversation list (GET /conversations), an infinite query. */
  list: () => ["conversations", "list"] as const,
  /** The unread conversations count behind the navigation badge (GET /conversations/unread-count). */
  unreadCount: () => ["conversations", "unread-count"] as const,
  /** One conversation with its other participant, for the thread header; null if unknown. */
  summary: (conversationId: string) => ["conversations", "summary", conversationId] as const,
  /** A thread's history (GET /conversations/{id}/messages), an infinite query, newest page first. */
  messages: (conversationId: string) => ["conversations", "messages", conversationId] as const,
  /** The polling query that merges new messages into the history (ADR-008). */
  poll: (conversationId: string) => ["conversations", "poll", conversationId] as const,
};

/** Mutation keys for conversations, so running mutations can be found in the mutation cache. */
export const conversationMutationKeys = {
  /** Prefix of every mark-read mutation. */
  markReadAll: ["conversations", "mark-read"] as const,
  /** Marking one conversation as read (PATCH /conversations/{id}/read). */
  markRead: (conversationId: string) => ["conversations", "mark-read", conversationId] as const,
};

/** URL of a conversation thread. */
export function conversationHref(conversationId: string): string {
  return `/messages/${encodeURIComponent(conversationId)}`;
}
