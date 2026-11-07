import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names conditionally (clsx) and resolves conflicting Tailwind
 * utilities so the last one wins (tailwind-merge), e.g. `cn("px-2", "px-4")` → `"px-4"`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
