"use client";

/*
 * Dev-only showcase (/dev/components). Text here is hard-coded English on
 * purpose: the page is not user-facing and never ships (see page.dev.tsx).
 * Dialogs, menus, tooltips and toasts render in a portal on <body>, so they
 * follow the page theme rather than the panel they were opened from.
 */

import { BellIcon, HeartIcon, InboxIcon, PlusIcon, SearchXIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import { ListRowSkeleton, PostCardSkeleton, ProfileHeaderSkeleton } from "@/components/skeletons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";

const buttonVariantNames = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const satisfies ReadonlyArray<ButtonProps["variant"]>;

const buttonSizeNames = ["sm", "md", "lg"] as const satisfies ReadonlyArray<ButtonProps["size"]>;

const swatches = [
  { name: "background", className: "bg-background" },
  { name: "card", className: "bg-card" },
  { name: "primary", className: "bg-primary" },
  { name: "secondary", className: "bg-secondary" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  { name: "highlight", className: "bg-highlight" },
  { name: "destructive", className: "bg-destructive" },
  { name: "border", className: "bg-border" },
  { name: "input", className: "bg-input" },
] as const;

/** Every shared component and state, in a light and a dark panel. */
export function ComponentShowcase() {
  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Component showcase</h1>
          <p className="text-sm text-muted-foreground">
            Dev only, excluded from production builds. The page theme (menu on the right) also
            controls dialogs, menus, tooltips and toasts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/">Back to app</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="grid gap-6 2xl:grid-cols-2">
        <ThemePanel theme="light" />
        <ThemePanel theme="dark" />
      </div>
    </div>
  );
}

function ThemePanel({ theme }: { theme: "light" | "dark" }) {
  return (
    <section
      data-theme-preview={theme}
      aria-label={`${theme} theme`}
      className="space-y-8 rounded-2xl border bg-background p-6 text-foreground"
    >
      <h2 className="text-lg font-semibold capitalize">{theme} theme</h2>
      <ColourSection />
      <ButtonSection />
      <BadgeAndAvatarSection />
      <CardSection />
      <OverlaySection />
      <TabsSection />
      <SearchSection />
      <SkeletonSection />
      <EmptyStateSection />
    </section>
  );
}

function Demo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ColourSection() {
  return (
    <Demo title="Colour tokens">
      <div className="flex flex-wrap gap-3">
        {swatches.map((swatch) => (
          <div key={swatch.name} className="flex flex-col items-center gap-1">
            <span className={`size-12 rounded-lg ring-1 ring-foreground/10 ${swatch.className}`} />
            <span className="text-xs text-muted-foreground">{swatch.name}</span>
          </div>
        ))}
      </div>
      <p className="text-sm">
        Body text, <span className="text-muted-foreground">muted text</span>,{" "}
        <span className="text-primary">primary text</span>,{" "}
        <span className="text-highlight-text">highlight text</span>.
      </p>
    </Demo>
  );
}

function ButtonSection() {
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Saved");
    }, 1500);
  }

  return (
    <Demo title="Button">
      <div className="space-y-3">
        {buttonVariantNames.map((variant) => (
          <div key={variant} className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-xs text-muted-foreground">{variant}</span>
            {buttonSizeNames.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {size}
              </Button>
            ))}
            <Button variant={variant} disabled>
              Disabled
            </Button>
            <Button variant={variant} loading>
              Loading
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-xs text-muted-foreground">with icon</span>
          <Button>
            <PlusIcon aria-hidden="true" />
            New post
          </Button>
          <Button variant="destructive">
            <Trash2Icon aria-hidden="true" />
            Delete
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Like">
            <HeartIcon aria-hidden="true" />
          </Button>
          <Button size="icon" variant="outline" aria-label="Notifications">
            <BellIcon aria-hidden="true" />
          </Button>
          <Button size="icon-lg" aria-label="Create">
            <PlusIcon aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-24 text-xs text-muted-foreground">try it</span>
          <Button loading={saving} onClick={save}>
            Save changes
          </Button>
          <span className="text-xs text-muted-foreground">
            Spinner for 1.5 s, keeps its width, then a toast.
          </span>
        </div>
      </div>
    </Demo>
  );
}

function BadgeAndAvatarSection() {
  return (
    <Demo title="Badge and avatar">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Primary</Badge>
        <Badge variant="highlight">12</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <UserAvatar name="Ada Lovelace" size="sm" />
        <UserAvatar name="Ada Lovelace" size="md" />
        <UserAvatar name="Grace Hopper" size="lg" />
        <UserAvatar name="Kasun" size="xl" />
        <UserAvatar name="Image avatar" src="/favicon.ico" size="lg" />
        <UserAvatar name="Broken image" src="/does-not-exist.png" size="lg" />
      </div>
    </Demo>
  );
}

function CardSection() {
  return (
    <Demo title="Card">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Surface colour, with title, description and footer.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content goes here.</p>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Confirm</Button>
        </CardFooter>
      </Card>
    </Demo>
  );
}

function OverlaySection() {
  return (
    <Demo title="Dialog, tooltip and toasts">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete post?</DialogTitle>
              <DialogDescription>
                This can&apos;t be undone. Esc or the close button dismisses it, and focus returns
                to the trigger.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={() => toast.success("Post deleted")}>
                  Delete
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>

        <Button variant="secondary" onClick={() => toast.success("Link copied")}>
          Success toast
        </Button>
        <Button variant="secondary" onClick={() => toast.error("Something went wrong")}>
          Error toast
        </Button>
        <Button variant="secondary" onClick={() => toast.info("Heads up")}>
          Info toast
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
              loading: "Uploading…",
              success: "Uploaded",
              error: "Upload failed",
            })
          }
        >
          Promise toast
        </Button>
      </div>
    </Demo>
  );
}

function TabsSection() {
  return (
    <Demo title="Tabs">
      <Tabs defaultValue="posts" className="max-w-md">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
          <TabsTrigger value="disabled" disabled>
            Disabled
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts">Posts panel. Arrow keys move between tabs.</TabsContent>
        <TabsContent value="saved">Saved panel.</TabsContent>
      </Tabs>
      <Tabs defaultValue="all" className="max-w-md">
        <TabsList variant="line">
          <TabsTrigger value="all">All users</TabsTrigger>
          <TabsTrigger value="following">People I follow</TabsTrigger>
        </TabsList>
      </Tabs>
    </Demo>
  );
}

function SearchSection() {
  const [typed, setTyped] = useState("");
  const [debounced, setDebounced] = useState("");

  return (
    <Demo title="Search input">
      <div className="max-w-md space-y-2">
        <SearchInput onValueChange={setTyped} onDebouncedChange={setDebounced} />
        <SearchInput disabled label="Disabled search" placeholder="Disabled" />
        <p className="text-xs text-muted-foreground">
          Typed: <code>{typed || "—"}</code> · Debounced (300 ms): <code>{debounced || "—"}</code>
        </p>
      </div>
    </Demo>
  );
}

function SkeletonSection() {
  return (
    <Demo title="Skeletons">
      <div className="grid gap-6 lg:grid-cols-2">
        <PostCardSkeleton />
        <div className="space-y-4">
          <ProfileHeaderSkeleton />
          <div className="divide-y">
            <ListRowSkeleton />
            <ListRowSkeleton withTrailing />
            <ListRowSkeleton />
          </div>
        </div>
      </div>
    </Demo>
  );
}

function EmptyStateSection() {
  return (
    <Demo title="Empty state">
      <div className="grid gap-4 lg:grid-cols-2">
        <EmptyState
          icon={InboxIcon}
          title="No messages yet"
          description="Start a conversation from someone's profile."
          action={<Button size="sm">Find people</Button>}
        />
        <EmptyState
          icon={SearchXIcon}
          title="No results"
          description="Try a different name or username."
        />
      </div>
    </Demo>
  );
}
