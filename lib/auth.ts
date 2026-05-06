import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "./prisma";

export async function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

function getSessionSecret(secret = process.env.NEXTAUTH_SECRET): string {
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET must be set");
  }

  return secret;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSessionToken(
  userId: string,
  secret = getSessionSecret(),
  expiresAt = Date.now() + 60 * 60 * 24 * 7 * 1000,
): string {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString("base64url");
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyAdminSessionToken(
  token: string,
  secret = getSessionSecret(),
  now = Date.now(),
): string | null {
  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null;
  }

  const payload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = signPayload(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: unknown;
      expiresAt?: unknown;
    };

    if (typeof decoded.userId !== "string" || typeof decoded.expiresAt !== "number") {
      return null;
    }

    if (decoded.expiresAt <= now) {
      return null;
    }

    return decoded.userId;
  } catch {
    return null;
  }
}

type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

export async function auth(): Promise<{ user: SessionUser } | null> {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin-session");

  if (!adminCookie?.value) {
    return null;
  }

  const userId = verifyAdminSessionToken(adminCookie.value);

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    return null;
  }

  return { user };
}
