import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  /** Usually a <TranslatedText /> from a server page, so it follows a language switch. */
  title: ReactNode;
  /** Optional controls aligned to the right of the title, e.g. "Mark all as read". */
  actions?: ReactNode;
  className?: string;
};

/** The page's single `<h1>`, with optional actions alongside it. */
export function PageHeader({ title, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-center justify-between gap-3", className)}>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
