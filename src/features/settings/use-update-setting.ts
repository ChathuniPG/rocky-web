"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authMeQueryKey } from "@/features/auth/auth-query";
import { useTranslations } from "@/i18n/i18n-provider";
import type { TranslationKey } from "@/i18n/translate";
import { api } from "@/lib/api/client";
import { isSessionExpiredError } from "@/lib/api/errors";
import { mapApiErrorToMessageKey } from "@/lib/api/map-api-error";
import type { User } from "@/lib/api/types";

import {
  acceptSetting,
  applySetting,
  rollbackSetting,
  settingUpdateBody,
  type SettingChange,
} from "./settings-cache";

function successKey(change: SettingChange): TranslationKey {
  if (change.field === "language") return "settings.language.saved";
  return change.value ? "settings.notifications.turnedOn" : "settings.notifications.turnedOff";
}

function errorKey(change: SettingChange): TranslationKey {
  return change.field === "language" ? "settings.language.error" : "settings.notifications.error";
}

/**
 * Saves one setting with PATCH /users/me (FR-SET-02, FR-SET-03),
 * optimistically: the cached signed-in user changes at once, a failure puts the
 * old value back and shows a toast. Changing the language in the cache is what
 * switches the interface, because AuthProvider applies the account's language
 * (use-account-language.ts).
 * Saves share one scope, so quick toggles reach the API in the order they were made.
 * `announceSuccess: false` skips the success toast, for a save the user didn't
 * make on this page (a language picked before signing in).
 */
export function useUpdateSetting({ announceSuccess = true }: { announceSuccess?: boolean } = {}) {
  const queryClient = useQueryClient();
  const t = useTranslations();

  return useMutation({
    scope: { id: "update-settings" },
    mutationFn: (change: SettingChange) =>
      api.patch("/users/me", { body: settingUpdateBody(change) }),
    onMutate: async (change) => {
      // A refetch of /auth/me in flight would land after this and undo it.
      await queryClient.cancelQueries({
        queryKey: authMeQueryKey,
        predicate: (query) => query.state.data !== undefined,
      });
      const previous = queryClient.getQueryData<User>(authMeQueryKey)?.[change.field];
      queryClient.setQueryData<User>(authMeQueryKey, (user) =>
        user ? applySetting(user, change) : user,
      );
      return { previous };
    },
    onSuccess: (saved, change) => {
      queryClient.setQueryData<User>(authMeQueryKey, (user) =>
        user ? acceptSetting(user, change, saved) : user,
      );
      if (announceSuccess) toast.success(t(successKey(change)));
    },
    onError: (error, change, context) => {
      const previous = context?.previous;
      if (previous !== undefined) {
        queryClient.setQueryData<User>(authMeQueryKey, (user) =>
          user ? rollbackSetting(user, change, previous) : user,
        );
      }
      if (isSessionExpiredError(error)) return;
      toast.error(t(errorKey(change)), { description: t(mapApiErrorToMessageKey(error)) });
    },
  });
}
