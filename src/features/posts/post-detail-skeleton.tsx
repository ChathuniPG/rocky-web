import { ListRowSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  postDetailGridClasses,
  postMediaPaneClasses,
  postPanelClasses,
} from "./post-detail-layout";

const COMMENT_ROW_COUNT = 3;

/**
 * Placeholder for the post page (FR-UI-03): the media pane and the comments
 * panel at their real sizes. aria-hidden; the surrounding region announces
 * loading.
 */
export function PostDetailSkeleton() {
  return (
    <div aria-hidden="true" className={postDetailGridClasses}>
      <Skeleton className={cn(postMediaPaneClasses, "rounded-none")} />
      <div className={cn(postPanelClasses, "gap-4 p-4")}>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-6 w-14" />
          <Skeleton className="ml-auto h-6 w-6" />
        </div>
        <div>
          {Array.from({ length: COMMENT_ROW_COUNT }, (_, index) => (
            <ListRowSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
