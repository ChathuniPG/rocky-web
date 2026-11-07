import { describe, expect, it } from "vitest";

import { ApiError, NetworkError } from "@/lib/api/errors";

import { mapEditProfileError } from "./map-edit-profile-error";

describe("mapEditProfileError", () => {
  it("maps 413 to the size limit", () => {
    expect(mapEditProfileError(new ApiError(413, "Payload Too Large"), "upload")).toEqual({
      key: "profile.edit.errors.tooLarge",
    });
  });

  it("lists the API's reasons for a rejected picture or profile", () => {
    expect(mapEditProfileError(new ApiError(400, ["Unsupported file type"]), "upload")).toEqual({
      key: "profile.edit.errors.rejectedFile",
      details: ["Unsupported file type"],
    });
    expect(mapEditProfileError(new ApiError(400, "bio too long"), "save")).toEqual({
      key: "profile.edit.errors.rejected",
      details: ["bio too long"],
    });
  });

  it("falls back to the generic messages", () => {
    expect(mapEditProfileError(new NetworkError(), "save")).toEqual({ key: "errors.network" });
    expect(mapEditProfileError(new ApiError(503, "down"), "upload")).toEqual({
      key: "errors.serviceUnavailable",
    });
  });
});
