"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<
  ComponentProps<"input">,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  /** Initial text, e.g. from the URL. */
  defaultValue?: string;
  /** Called on every keystroke with the current text. */
  onValueChange?: (value: string) => void;
  /** Called once typing pauses for `debounceMs`, and immediately on clear (FR-SRCH-02). */
  onDebouncedChange?: (value: string) => void;
  /** Pause before `onDebouncedChange` fires. */
  debounceMs?: number;
  /** Accessible name; defaults to "Search users". */
  label?: string;
};

/**
 * Search field with a leading icon and a clear button. Debouncing happens in the
 * change handler (not an effect), so the parent hears about a value exactly
 * once per pause. Escape clears the text.
 */
export function SearchInput({
  defaultValue = "",
  onValueChange,
  onDebouncedChange,
  debounceMs = 300,
  label,
  placeholder,
  className,
  disabled,
  ...props
}: SearchInputProps) {
  const t = useTranslations();
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Drop a pending call if the component unmounts mid-pause.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  function update(next: string, { immediate }: { immediate: boolean }) {
    setValue(next);
    onValueChange?.(next);
    clearTimeout(timerRef.current);
    if (immediate) {
      onDebouncedChange?.(next);
    } else {
      timerRef.current = setTimeout(() => onDebouncedChange?.(next), debounceMs);
    }
  }

  function clear() {
    update("", { immediate: true });
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape" && value !== "") {
      event.preventDefault();
      clear();
    }
  }

  return (
    <div className={cn("relative w-full", className)}>
      <SearchIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => update(event.target.value, { immediate: false })}
        onKeyDown={handleKeyDown}
        aria-label={label ?? t("search.label")}
        placeholder={placeholder ?? t("search.placeholder")}
        disabled={disabled}
        autoComplete="off"
        // Hide the browser's own clear button; ours is labelled and themed.
        className="h-10 rounded-full pr-10 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
      {value !== "" && !disabled ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={clear}
          aria-label={t("search.clear")}
          className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full active:-translate-y-1/2"
        >
          <XIcon aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
