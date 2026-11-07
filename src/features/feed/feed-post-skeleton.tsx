import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { feedMediaFrameClasses, feedPostLayoutClasses } from "./feed-layout";

const ACTION_COUNT = 5;

/**
 * Placeholder for a feed post (FR-UI-03): the 9:16 media frame and the action
 * column, at the same sizes as FeedPost so nothing shifts once it loads. Fills
 * its parent's height. aria-hidden; the surrounding region announces loading.
 */
export function FeedPostSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn(feedPostLayoutClasses, className)}>
      <Skeleton className={feedMediaFrameClasses} />
      <div className="flex gap-4 md:flex-col md:pb-2">
        {Array.from({ length: ACTION_COUNT }, (_, index) => (
          <Skeleton key={index} className="size-11 rounded-full" />
        ))}
      </div>
    </div>
  );
}
