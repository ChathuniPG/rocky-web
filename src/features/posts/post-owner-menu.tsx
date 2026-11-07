"use client";

import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useRef, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/i18n/i18n-provider";
import type { Post } from "@/lib/api/types";

import { EditCaptionDialog } from "./edit-caption-dialog";
import { useDeletePost } from "./use-post-owner-mutations";

type PostOwnerMenuProps = {
  post: Pick<Post, "id" | "caption">;
  /** Called once the post is deleted; the caller leaves the page and clears the cache. */
  onDeleted: () => void;
};

/**
 * The "…" menu on the viewer's own post: edit caption (FR-POST-04) and delete
 * after confirmation (FR-POST-05). The dialogs are siblings of the menu, not
 * inside it, so they stay open after the menu closes.
 */
export function PostOwnerMenu({ post, onDeleted }: PostOwnerMenuProps) {
  const t = useTranslations();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deletePost = useDeletePost(post.id);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Set when a menu item opens a dialog. The closing menu would otherwise move focus
  // back to its trigger just as the dialog opens and hides the page behind it
  // (aria-hidden on a focused element), and the dialog would not focus its field.
  const openingDialogRef = useRef(false);

  function openDialog(open: (value: boolean) => void) {
    openingDialogRef.current = true;
    open(true);
  }

  // The dialogs have no trigger of their own; on close, focus returns to the "…" button.
  function returnFocusToTrigger(event: Event) {
    event.preventDefault();
    triggerRef.current?.focus();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} variant="ghost" size="icon-sm" aria-label={t("postOwner.menu")}>
            <EllipsisIcon aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-auto min-w-44"
          onCloseAutoFocus={(event) => {
            if (!openingDialogRef.current) return;
            openingDialogRef.current = false;
            event.preventDefault();
          }}
        >
          <DropdownMenuItem onSelect={() => openDialog(setEditOpen)}>
            <PencilIcon aria-hidden="true" />
            {t("postOwner.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => openDialog(setDeleteOpen)}>
            <Trash2Icon aria-hidden="true" />
            {t("postOwner.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCaptionDialog
        post={post}
        open={editOpen}
        onOpenChange={setEditOpen}
        onCloseAutoFocus={returnFocusToTrigger}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deletePost.title")}
        description={t("deletePost.description")}
        confirmLabel={t("deletePost.confirm")}
        isPending={deletePost.isPending}
        onCloseAutoFocus={returnFocusToTrigger}
        onConfirm={() => deletePost.mutate(undefined, { onSuccess: onDeleted })}
      />
    </>
  );
}
