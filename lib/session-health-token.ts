import { createHmac, timingSafeEqual } from "crypto";

const HEALTH_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function getSecret(secret = process.env.NEXTAUTH_SECRET): string {
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET must be set");
  }

  return secret;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionHealthToken(
  sessionId: string,
  secret = getSecret(),
  expiresAt = Date.now() + HEALTH_TOKEN_TTL_MS,
): string {
  const payload = Buffer.from(JSON.stringify({ sessionId, expiresAt })).toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifySessionHealthToken(
  token: string,
  expectedSessionId: string,
  secret = getSecret(),
  now = Date.now(),
): boolean {
  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return false;
  }

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      sessionId?: unknown;
      expiresAt?: unknown;
    };

    return (
      decoded.sessionId === expectedSessionId &&
      typeof decoded.expiresAt === "number" &&
      decoded.expiresAt > now
    );
  } catch {
    return false;
  }
}
