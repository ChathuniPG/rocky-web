import { ThemeToggle } from "@/components/theme-toggle";
import { getTranslations } from "@/i18n/server";

/**
 * Layout for /login and /signup: no navigation (design.md 7.1), just the brand
 * and a centred card. The theme toggle stays available before sign-in.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  const t = getTranslations();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <p className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-lg bg-primary text-xl font-black text-primary-foreground"
        >
          R
        </span>
        {t("common.appName")}
      </p>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
