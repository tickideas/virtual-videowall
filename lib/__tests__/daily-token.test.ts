import { describe, expect, it } from "vitest";
import { parseDailyTokenRequest } from "../daily-token";

describe("parseDailyTokenRequest", () => {
  it("requires a session id for church publisher tokens", () => {
    const result = parseDailyTokenRequest({
      sessionCode: "ABC123",
      churchName: "Grace Church",
      participantType: "church",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Session ID is required for church tokens");
  });

  it("allows viewer tokens without a session id", () => {
    const result = parseDailyTokenRequest({
      sessionCode: "ABC123",
      participantType: "viewer",
    });

    expect(result.success).toBe(true);
  });
});
