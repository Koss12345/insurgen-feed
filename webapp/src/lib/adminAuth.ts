import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";

/**
 * MVP-level auth: the cookie value is the shared admin key itself,
 * httpOnly + secure so it isn't readable from client JS or sent over
 * plain HTTP. Good enough for a small internal admin page behind a
 * single shared secret; swap for real sessions/accounts before this
 * holds anything more sensitive than lead contact info.
 */
export async function isAdminAuthed(): Promise<boolean> {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return false;
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === adminKey;
}
