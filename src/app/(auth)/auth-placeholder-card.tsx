import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthPlaceholderCardProps = {
  title: string;
  description: string;
  switchPrompt: string;
  switchLink: string;
  switchHref: "/login" | "/signup";
};

/**
 * Card shown on /login and /signup until the forms are built, with a link
 * between the two pages. Not a route: only `page.tsx` files become routes.
 */
export function AuthPlaceholderCard({
  title,
  description,
  switchPrompt,
  switchLink,
  switchHref,
}: AuthPlaceholderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="text-xl font-bold">{title}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {switchPrompt}{" "}
          <Link
            href={switchHref}
            className="rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
          >
            {switchLink}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
