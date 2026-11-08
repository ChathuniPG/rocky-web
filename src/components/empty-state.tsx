import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional call to action, e.g. a Button or a link styled as one. */
  action?: ReactNode;
  /**
   * Heading level of the title. "h1" when the empty state is the whole page, e.g.
   * a not-found state with no other page heading (WCAG 1.3.1, 2.4.6).
   */
  titleAs?: "h1" | "h2";
  className?: string;
};

/**
 * Shown when a list or view has nothing to display (FR-UI-04): an icon, a short
 * title, an explanation and, where useful, a next step.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  titleAs: Title = "h2",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </div>
      <Title className="text-base font-semibold text-balance">{title}</Title>
      {description ? (
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
