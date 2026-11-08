import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

/** Class recipe for every button look; also usable on links via `asChild`. */
const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none",
    // FR-UI-02: visible focus (solid ring = 3:1+ against the page), active press, disabled.
    "focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-progress aria-disabled:pointer-events-none aria-disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_8%)] active:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_12%)] aria-expanded:bg-[color-mix(in_oklab,var(--secondary),var(--foreground)_8%)]",
        outline:
          "border-input bg-card hover:bg-accent hover:text-accent-foreground active:bg-accent aria-expanded:bg-accent",
        ghost:
          "hover:bg-accent hover:text-accent-foreground active:bg-[color-mix(in_oklab,var(--accent),var(--foreground)_6%)] aria-expanded:bg-accent",
        // Mixing towards --foreground darkens in light mode (white text) and lightens
        // in dark mode (dark text), so hover keeps AA contrast in both themes.
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklab,var(--destructive),var(--foreground)_15%)] focus-visible:ring-destructive active:bg-[color-mix(in_oklab,var(--destructive),var(--foreground)_20%)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 gap-1.5 px-3 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-9 gap-2 px-4",
        lg: "h-11 gap-2 px-6 text-base [&_svg:not([class*='size-'])]:size-5",
        "icon-sm": "size-8",
        icon: "size-9",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

/** Props for {@link Button}. */
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the single child (e.g. a Next.js `<Link>`) with button styles instead of a `<button>`. */
    asChild?: boolean;
    /**
     * Shows a spinner, marks the button busy and ignores presses (FR-AUTH-05: no
     * duplicate submits). The button stays focusable, like `focusableWhenDisabled`.
     */
    loading?: boolean;
    /**
     * Keeps a disabled button focusable (`aria-disabled` instead of `disabled`) and
     * ignores presses. For buttons that can disable themselves while focused, e.g.
     * "Mark all as read" after it succeeds, so keyboard focus isn't dropped to the
     * page (WCAG 2.4.3, NFR-UX-02).
     */
    focusableWhenDisabled?: boolean;
  };

// A `disabled` button loses focus, so inactive-but-focusable buttons block the
// click (and, for submit buttons, the form submission it would trigger) instead.
function preventActivation(event: React.MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

/**
 * Button with primary, secondary, outline, ghost, destructive and link variants.
 * While `loading`, the label stays in place but transparent so the button keeps
 * its width and its accessible name, and a spinner is centred on top.
 */
function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  loading = false,
  focusableWhenDisabled = false,
  disabled,
  onClick,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        className={classes}
        onClick={onClick}
        {...props}
      >
        {children}
      </Slot.Root>
    );
  }

  // Loading never uses `disabled`: the focused button (e.g. "Load more" that a
  // scroll sentinel just triggered) would drop keyboard focus to the page (2.4.3).
  const isDisabled = disabled === true;
  const isInactive = loading || (isDisabled && focusableWhenDisabled);

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      disabled={isDisabled && !focusableWhenDisabled}
      aria-disabled={isInactive || undefined}
      aria-busy={loading || undefined}
      onClick={isInactive ? preventActivation : onClick}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center gap-[inherit]",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
      {loading ? (
        <Loader2Icon aria-hidden="true" className="absolute inset-0 m-auto animate-spin" />
      ) : null}
    </button>
  );
}

export { Button, buttonVariants, type ButtonProps };
