import { Fragment, type ReactNode } from "react";

import { splitTemplate } from "./template-parts";

type RichTextProps = {
  /** A translated template, from `t(key)` without values, e.g. "{name} liked your post". */
  template: string;
  /** Elements that replace the template's tokens; unknown tokens stay visible as text. */
  values: Record<string, ReactNode>;
};

/**
 * Renders a translated sentence with React elements in place of its tokens,
 * e.g. the actor's name in bold. Each language decides where the token goes.
 * Everything is rendered as React nodes, never as HTML.
 */
export function RichText({ template, values }: RichTextProps) {
  return (
    <>
      {splitTemplate(template).map((part, index) => (
        <Fragment key={index}>
          {part.kind === "text"
            ? part.value
            : part.name in values
              ? values[part.name]
              : `{${part.name}}`}
        </Fragment>
      ))}
    </>
  );
}
