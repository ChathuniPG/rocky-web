import { BrandLogo } from "@/components/brand-logo";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TranslatedText } from "@/i18n/translated-text";

/**
 * Layout for /login and /signup: no navigation (design.md 7.1), just the brand
 * and a centred card. The language menu and theme toggle stay available
 * before sign-in.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      {/* A banner landmark, so the brand and the toolbar aren't outside every landmark. */}
      <header>
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <LanguageMenu />
          <ThemeToggle />
        </div>
        <p className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
          <BrandLogo size={40} />
          <TranslatedText id="common.appName" />
        </p>
      </header>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
