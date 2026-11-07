import { describe, expect, it } from "vitest";

import { ApiError, NetworkError } from "@/lib/api/errors";

import { mapCreatePostError } from "./map-create-post-error";

describe("mapCreatePostError", () => {
  it("maps 413 to the size limits", () => {
    expect(mapCreatePostError(new ApiError(413, "Payload Too Large"), "upload")).toEqual({
      key: "createPost.errors.tooLarge",
    });
  });

  it("lists the API's reasons for a rejected file", () => {
    expect(mapCreatePostError(new ApiError(400, ["Unsupported file type"]), "upload")).toEqual({
      key: "createPost.errors.rejectedFile",
      details: ["Unsupported file type"],
    });
  });

  it("uses a post-level message for a 400 from POST /posts", () => {
    expect(mapCreatePostError(new ApiError(400, "caption too long"), "create")).toMatchObject({
      key: "createPost.errors.rejectedPost",
    });
  });

  it("falls back to the generic messages", () => {
    expect(mapCreatePostError(new NetworkError(), "upload")).toEqual({ key: "errors.network" });
    expect(mapCreatePostError(new ApiError(429, "Too Many Requests"), "upload")).toEqual({
      key: "errors.tooManyRequests",
    });
    expect(mapCreatePostError(new ApiError(503, "Unavailable"), "create")).toEqual({
      key: "errors.serviceUnavailable",
    });
  });
});
