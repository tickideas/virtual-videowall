export type DailyParticipantType = "church" | "viewer";

export type DailyTokenRequest =
  | {
      success: true;
      sessionCode: string;
      participantType: DailyParticipantType;
      churchName?: string;
      sessionId?: string;
    }
  | {
      success: false;
      error: string;
    };

export function parseDailyTokenRequest(body: unknown): DailyTokenRequest {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request body" };
  }

  const request = body as Record<string, unknown>;
  const sessionCode = typeof request.sessionCode === "string" ? request.sessionCode : "";
  const churchName = typeof request.churchName === "string" ? request.churchName : undefined;
  const sessionId = typeof request.sessionId === "string" ? request.sessionId : undefined;
  const participantType =
    request.participantType === "viewer" || request.participantType === "church"
      ? request.participantType
      : "church";

  if (!sessionCode) {
    return { success: false, error: "Session code is required" };
  }

  if (participantType === "church") {
    if (!churchName) {
      return { success: false, error: "Church name is required for church tokens" };
    }

    if (!sessionId) {
      return { success: false, error: "Session ID is required for church tokens" };
    }
  }

  return {
    success: true,
    sessionCode,
    participantType,
    churchName,
    sessionId,
  };
}
