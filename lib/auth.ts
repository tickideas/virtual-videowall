import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export async function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword);
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
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

  const user = await prisma.user.findUnique({
    where: { id: adminCookie.value },
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
