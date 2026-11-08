import { describe, expect, it } from "vitest";

import { getDictionary, locales } from "./translate";
import { splitTemplate } from "./template-parts";

describe("splitTemplate", () => {
  it("splits text and tokens in order", () => {
    expect(splitTemplate("{name} liked your post")).toEqual([
      { kind: "token", name: "name" },
      { kind: "text", value: " liked your post" },
    ]);
    expect(splitTemplate("Hi {a}, meet {b}!")).toEqual([
      { kind: "text", value: "Hi " },
      { kind: "token", name: "a" },
      { kind: "text", value: ", meet " },
      { kind: "token", name: "b" },
      { kind: "text", value: "!" },
    ]);
  });

  it("returns plain text as one part and an empty template as none", () => {
    expect(splitTemplate("No tokens")).toEqual([{ kind: "text", value: "No tokens" }]);
    expect(splitTemplate("")).toEqual([]);
  });

  it("finds the actor token in every language's notification sentences", () => {
    for (const locale of locales) {
      for (const sentence of Object.values(getDictionary(locale).notifications.item)) {
        expect(splitTemplate(sentence)).toContainEqual({ kind: "token", name: "name" });
      }
    }
  });
});
