import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setAdminSession, verifyPassword } from "@/lib/adminAuth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Укажите email и пароль" }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
  }

  await setAdminSession(user.id);
  return NextResponse.json({ ok: true });
}
