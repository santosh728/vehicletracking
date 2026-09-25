import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { getDb } from "./mongodb";

export type SessionUser = {
  id: string;
  username: string;
  fullName: string;
  mobile: string;
  role: "user" | "super_admin";
};

const cookieName = "routewatch_session";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSession() {
  cookies().set(cookieName, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      username: String(payload.username),
      fullName: String(payload.fullName),
      mobile: String(payload.mobile),
      role: payload.role === "super_admin" ? "super_admin" : "user"
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.role !== "super_admin") throw new Error("FORBIDDEN");
  return session;
}

export async function findUserByUsername(username: string) {
  return getDb().then((db) => db.collection("users").findOne({ username }));
}
