"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { conversationHref, conversationKeys } from "@/features/messages/conversation-query-keys";
import { useTranslations } from "@/i18n/i18n-provider";
import { api } from "@/lib/api/client";
import { isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";

/**
 * Starts (or reopens) a conversation with another user and opens it
 * (FR-PROF-06). POST /conversations returns the existing conversation if there
 * is one, so pressing it twice never creates a duplicate. The response is
 * kept as the thread's header data, since the API has no endpoint for one
 * conversation. The visible text is part of the accessible name, which adds
 * the person's name.
 */
export function MessageButton({ user }: { user: { id: string; displayName: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();

  const startConversation = useMutation({
    mutationFn: () => api.post("/conversations", { body: { recipientId: user.id } }),
    onSuccess: (conversation) => {
      queryClient.setQueryData(conversationKeys.summary(conversation.id), conversation);
      // A new conversation isn't in the cached list yet; reload it the next time it shows.
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list(),
        refetchType: "none",
      });
      router.push(conversationHref(conversation.id));
    },
    onError: (error) => {
      if (isSessionExpiredError(error)) return;
      toast.error(t("profile.message.failed"), {
        description: t(mapApiErrorToMessageKey(error)),
      });
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      aria-label={t("profile.message.label", { name: user.displayName })}
      loading={startConversation.isPending}
      onClick={() => startConversation.mutate()}
    >
      <MessageCircleIcon aria-hidden="true" />
      {t("profile.message.button")}
    </Button>
  );
}
