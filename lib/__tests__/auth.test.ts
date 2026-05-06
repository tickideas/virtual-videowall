import { describe, expect, it } from "vitest";
import { createAdminSessionToken, verifyAdminSessionToken } from "../auth";

describe("admin session token helpers", () => {
  it("returns the user id for an untampered signed token", () => {
    const token = createAdminSessionToken("user_123", "test-secret");

    expect(verifyAdminSessionToken(token, "test-secret")).toBe("user_123");
  });

  it("rejects a token signed with a different secret", () => {
    const token = createAdminSessionToken("user_123", "test-secret");

    expect(verifyAdminSessionToken(token, "other-secret")).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(verifyAdminSessionToken("user_123", "test-secret")).toBeNull();
  });

  it("rejects an expired signed token", () => {
    const token = createAdminSessionToken("user_123", "test-secret", Date.now() - 1);

    expect(verifyAdminSessionToken(token, "test-secret")).toBeNull();
  });
});
