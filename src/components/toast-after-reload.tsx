"use client";

import { useEffect } from "react";
import { toast } from "sonner";

import { takeToastAfterReload } from "@/lib/toast-after-reload";

/**
 * Shows the success toast queued before a full page load (login, sign-up,
 * logout), once. Renders nothing; place it after the <Toaster /> so the
 * Toaster is listening when this effect runs.
 */
export function ToastAfterReload() {
  useEffect(() => {
    const message = takeToastAfterReload();
    if (message) toast.success(message);
  }, []);
  return null;
}
