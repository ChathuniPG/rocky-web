import { CircleAlertIcon } from "lucide-react";

type FormErrorAlertProps = {
  message: string;
  /** Extra lines, e.g. the API's validation messages. */
  details?: string[];
};

/**
 * Form-level error shown above the fields (e.g. wrong password, network
 * failure). `role="alert"` makes screen readers announce it as soon as it appears.
 */
export function FormErrorAlert({ message, details }: FormErrorAlertProps) {
  return (
    <div
      role="alert"
      // Text uses the foreground colour: red text on the tinted background would fall
      // below WCAG AA contrast; the icon and border carry the error colour.
      className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2.5 text-sm text-foreground"
    >
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-1">
        <p className="font-medium">{message}</p>
        {details && details.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-4">
            {details.map((detail, index) => (
              // The API may repeat a message, so the index keeps keys unique.
              <li key={`${index}-${detail}`}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
