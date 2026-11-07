"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Slider as SliderPrimitive } from "radix-ui";

type SliderProps = React.ComponentProps<typeof SliderPrimitive.Root> & {
  /**
   * Props for each thumb, the element with role="slider" that screen readers
   * announce: pass `aria-label` and `aria-valuetext` here, not on the root.
   */
  thumbProps?: Omit<React.ComponentProps<typeof SliderPrimitive.Thumb>, "className">;
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
};

/**
 * shadcn/ui slider (Radix): keyboard support (arrows, Page Up/Down, Home/End)
 * and ARIA values built in. Extended with thumb props and part class names so
 * the video player can label it and draw it over media (FR-FEED-09).
 */
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  thumbProps,
  trackClassName,
  rangeClassName,
  thumbClassName,
  ...props
}: SliderProps) {
  const _values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max]),
    [value, defaultValue, min, max],
  );

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full bg-muted data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
          trackClassName,
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute bg-primary select-none data-horizontal:h-full data-vertical:w-full",
            rangeClassName,
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          {...thumbProps}
          className={cn(
            "relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50",
            thumbClassName,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
