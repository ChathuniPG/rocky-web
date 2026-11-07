import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/*
 * Loading placeholders shaped like the content they stand in for (FR-UI-03).
 * They are aria-hidden; the surrounding region announces loading
 * (e.g. aria-busy plus a visually hidden status message).
 */

/** Placeholder for a profile header: avatar, names, counts and bio. */
export function ProfileHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6", className)}
    >
      <Skeleton className="size-24 shrink-0 rounded-full" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full max-w-sm" />
      </div>
    </div>
  );
}

/** Placeholder for a list row: avatar, two lines of text and an optional trailing element. */
export function ListRowSkeleton({
  withTrailing = false,
  className,
}: {
  withTrailing?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("flex items-center gap-3 py-3", className)}>
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      {withTrailing ? <Skeleton className="h-8 w-20 rounded-lg" /> : null}
    </div>
  );
}
