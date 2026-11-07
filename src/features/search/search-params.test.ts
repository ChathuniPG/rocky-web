import { describe, expect, it } from "vitest";

import {
  buildSearchHref,
  normalizeSearchQuery,
  parseSearchFilter,
  readSearchState,
  SEARCH_QUERY_MAX_LENGTH,
} from "./search-params";

describe("parseSearchFilter", () => {
  it("accepts following and treats anything else as all", () => {
    expect(parseSearchFilter("following")).toBe("following");
    expect(parseSearchFilter("all")).toBe("all");
    expect(parseSearchFilter(null)).toBe("all");
    expect(parseSearchFilter("FOLLOWING")).toBe("all");
    expect(parseSearchFilter("friends")).toBe("all");
  });
});

describe("readSearchState", () => {
  it("reads the query and the filter", () => {
    expect(readSearchState(new URLSearchParams("q=ali&filter=following"))).toEqual({
      query: "ali",
      filter: "following",
    });
  });

  it("defaults to an empty query and all users", () => {
    expect(readSearchState(new URLSearchParams(""))).toEqual({ query: "", filter: "all" });
  });

  it("caps a hand-edited query at the API's maximum length", () => {
    const long = "a".repeat(SEARCH_QUERY_MAX_LENGTH + 10);
    expect(readSearchState(new URLSearchParams({ q: long })).query).toHaveLength(
      SEARCH_QUERY_MAX_LENGTH,
    );
  });
});

describe("normalizeSearchQuery", () => {
  it("trims spaces", () => {
    expect(normalizeSearchQuery("  ali  ")).toBe("ali");
    expect(normalizeSearchQuery("   ")).toBe("");
  });
});

describe("buildSearchHref", () => {
  it("leaves out defaults", () => {
    expect(buildSearchHref({ query: "", filter: "all" })).toBe("/search");
    expect(buildSearchHref({ query: "  ", filter: "all" })).toBe("/search");
  });

  it("includes a trimmed query and a non-default filter", () => {
    expect(buildSearchHref({ query: " ali ", filter: "all" })).toBe("/search?q=ali");
    expect(buildSearchHref({ query: "ali", filter: "following" })).toBe(
      "/search?q=ali&filter=following",
    );
    expect(buildSearchHref({ query: "", filter: "following" })).toBe("/search?filter=following");
  });

  it("encodes special characters", () => {
    expect(buildSearchHref({ query: "a&b c", filter: "all" })).toBe("/search?q=a%26b+c");
  });
});
