"use client";

import type { ComponentType, ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

type SettingOptionProps = {
  /** The radio's value, also used to build its id. */
  value: string;
  /** Prefix for the radio's id, unique per group. */
  groupId: string;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  /** Set when the label is in another language than the page, e.g. "සිංහල". */
  lang?: string;
  children: ReactNode;
};

/**
 * A radio option drawn as a selectable tile: the whole tile is the label, so
 * clicking anywhere selects it, and the selected tile gets a purple border.
 */
export function SettingOption({ value, groupId, icon: Icon, lang, children }: SettingOptionProps) {
  const id = `${groupId}-${value}`;
  return (
    <Label
      htmlFor={id}
      lang={lang}
      className="cursor-pointer gap-3 rounded-lg border p-3 leading-normal transition-colors hover:bg-muted active:bg-muted/70 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
    >
      <RadioGroupItem id={id} value={value} />
      {Icon ? <Icon aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
      {children}
    </Label>
  );
}
