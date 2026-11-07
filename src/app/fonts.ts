import { Inter, Noto_Sans_Sinhala } from "next/font/google";

/** Latin UI font, exposed as the `--font-inter` CSS variable. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Sinhala font, exposed as `--font-sinhala`. It sits second in the `font-sans`
 * stack, so Sinhala glyphs fall through to it automatically. Not preloaded:
 * its unicode-range means the browser only downloads it when Sinhala text renders.
 */
export const notoSansSinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  display: "swap",
  preload: false,
  variable: "--font-sinhala",
});
