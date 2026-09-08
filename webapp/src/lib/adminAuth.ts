import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function sessionSecret(): string {
  // Falls back to a fixed dev string so local dev works without extra
  // setup; production must set a real ADMIN_SESSION_SECRET or sessions
  // are forgeable.
  return process.env.ADMIN_SESSION_SECRET || "dev-insecure-session-secret";
}

function signSession(userId: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(userId).digest("hex");
}

/** Stateless session cookie: `<userId>.<hmac(userId)>` — no session table to manage. */
export async function setAdminSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, `${userId}.${signSession(userId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function getAdminUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!value) return null;
  const dotIndex = value.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const userId = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);
  return signature === signSession(userId) ? userId : null;
}

export async function isAdminAuthed(): Promise<boolean> {
  return (await getAdminUserId()) !== null;
}
