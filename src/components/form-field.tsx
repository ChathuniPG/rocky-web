import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

/** Accessibility attributes {@link FormField} hands to its control. */
export type FormControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FormFieldProps = {
  /** Unique id for the control; the label, hint and error ids derive from it. */
  id: string;
  label: string;
  /** Always-visible guidance, e.g. password rules. */
  hint?: string;
  /** Already-translated error message; shown under the control when set. */
  error?: string;
  /** Renders the control with the ids and ARIA attributes that link it to the label, hint and error. */
  children: (control: FormControlProps) => ReactNode;
};

/**
 * One labelled form control with an optional hint and a field-level error
 * underneath (design: errors appear under each field). Screen readers announce
 * the hint and error with the control via `aria-describedby`.
 */
export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describedBy })}
      {error ? (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
