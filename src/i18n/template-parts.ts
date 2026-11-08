/** A piece of a translated template: literal text or a `{token}` placeholder. */
export type TemplatePart = { kind: "text"; value: string } | { kind: "token"; name: string };

/**
 * Splits a template such as "{name} liked your post" into text and token
 * parts, so a component can render a token as an element (e.g. a bold name)
 * wherever the language puts it. Empty text parts are dropped.
 */
export function splitTemplate(template: string): TemplatePart[] {
  const parts: TemplatePart[] = [];
  let lastIndex = 0;
  for (const match of template.matchAll(/\{(\w+)\}/g)) {
    const [token, name] = match;
    if (match.index > lastIndex) {
      parts.push({ kind: "text", value: template.slice(lastIndex, match.index) });
    }
    parts.push({ kind: "token", name: name ?? token });
    lastIndex = match.index + token.length;
  }
  if (lastIndex < template.length) parts.push({ kind: "text", value: template.slice(lastIndex) });
  return parts;
}
