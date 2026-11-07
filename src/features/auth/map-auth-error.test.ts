import { describe, expect, it } from "vitest";

import { ApiError, NetworkError } from "@/lib/api/errors";

import { mapAuthError } from "./map-auth-error";

describe("mapAuthError", () => {
  it("maps 401 to invalid credentials", () => {
    expect(mapAuthError(new ApiError(401, "Invalid email or password"))).toEqual({
      key: "auth.errors.invalidCredentials",
    });
  });

  it("attaches a taken username to the username field", () => {
    expect(mapAuthError(new ApiError(409, "Username is already taken"))).toEqual({
      key: "auth.errors.usernameTaken",
      field: "username",
    });
  });

  it("attaches a taken email to the email field", () => {
    expect(mapAuthError(new ApiError(409, "The email address is already in use"))).toEqual({
      key: "auth.errors.emailTaken",
      field: "email",
    });
  });

  it("keeps an unrecognised conflict at form level", () => {
    expect(mapAuthError(new ApiError(409, "Resource already exists"))).toEqual({
      key: "auth.errors.conflict",
    });
  });

  it("lists the API's validation messages for 400", () => {
    expect(mapAuthError(new ApiError(400, ["a is wrong", "b is wrong"]))).toEqual({
      key: "auth.errors.validation",
      details: ["a is wrong", "b is wrong"],
    });
  });

  it.each([
    [403, "auth.errors.accountDisabled"],
    [429, "auth.errors.tooManyAttempts"],
    [500, "auth.errors.serviceUnavailable"],
    [503, "auth.errors.serviceUnavailable"],
    [418, "auth.errors.unknown"],
  ])("maps status %i to %s", (status, key) => {
    expect(mapAuthError(new ApiError(status, "x")).key).toBe(key);
  });

  it("maps network failures and unknown errors", () => {
    expect(mapAuthError(new NetworkError()).key).toBe("auth.errors.network");
    expect(mapAuthError(new Error("boom")).key).toBe("auth.errors.unknown");
  });
});
