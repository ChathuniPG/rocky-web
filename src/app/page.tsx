/**
 * Temporary home page. Replaced by the feed inside the app layout in #5; the
 * swatches make it easy to check the theme tokens in light and dark mode.
 */
export default function HomePage() {
  const swatches = [
    "bg-background",
    "bg-card",
    "bg-primary",
    "bg-secondary",
    "bg-muted",
    "bg-highlight",
    "bg-destructive",
  ];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight text-primary">R.O.C.K.Y.</h1>
      <div className="flex gap-2" aria-hidden="true">
        {swatches.map((swatch) => (
          <span key={swatch} className={`size-10 rounded-lg border ${swatch}`} />
        ))}
      </div>
    </main>
  );
}
