import type { ReactNode } from "react";

type SettingsSectionProps = {
  /** Used for the heading's id, so the section's controls can be labelled by it. */
  id: string;
  title: string;
  description: string;
  children: ReactNode;
};

/** The id of a section's heading, for `aria-labelledby` on the controls inside it. */
export function settingsHeadingId(sectionId: string): string {
  return `settings-${sectionId}-heading`;
}

/** One group on the Settings page: a heading, a short description and its controls. */
export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const headingId = settingsHeadingId(id);
  return (
    <section aria-labelledby={headingId} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-1">
        <h2 id={headingId} className="text-base font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
