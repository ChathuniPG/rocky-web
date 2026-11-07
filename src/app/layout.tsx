import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme-provider";

import { inter, notoSansSinhala } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "R.O.C.K.Y.",
    template: "%s · R.O.C.K.Y.",
  },
  description: "Regular Online Content Kernel Yarn: share short videos and photos.",
};

/** Root layout: fonts, global styles and app-wide providers. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes sets the `class` on <html> before
    // React hydrates, so the server and client markup differ on purpose.
    <html
      lang="en"
      className={`${inter.variable} ${notoSansSinhala.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
