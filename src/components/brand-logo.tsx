import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The R.O.C.K.Y. logo, drawn at a fixed square size. Decorative (`alt=""`): it
 * always sits next to the app name (visible, or sr-only below 1280px in the
 * sidebar), which gives the surrounding element its name (A11Y-13).
 */
export function BrandLogo({ size, className }: { size: number; className?: string }) {
  return (
    <Image
      src="/brand/rocky-logo.png"
      alt=""
      width={size}
      height={size}
      // Always above the fold; eager avoids the logo popping in after the text.
      // The fixed width/height reserve its box, so there is no layout shift.
      loading="eager"
      className={cn("shrink-0", className)}
    />
  );
}
