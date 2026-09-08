import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, isAdminAuthed, setAdminSession } from "@/lib/adminAuth";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Creates an admin account. The very first account (no admins exist yet)
 * is a one-time bootstrap gated by ADMIN_BOOTSTRAP_KEY, so the endpoint
 * isn't wide open right after deploy. Every account after that requires
 * an already-authenticated admin — self-service signup would let anyone
 * with the URL grant themselves access to leads.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { email, password, bootstrapKey } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
    bootstrapKey?: unknown;
  };

  if (typeof email !== "string" || !isValidEmail(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Пароль должен быть не короче 8 символов" }, { status: 400 });
  }

  const adminCount = await prisma.adminUser.count();

  if (adminCount === 0) {
    const expectedKey = process.env.ADMIN_BOOTSTRAP_KEY;
    if (!expectedKey || bootstrapKey !== expectedKey) {
      return NextResponse.json({ error: "Неверный ключ первоначальной настройки" }, { status: 401 });
    }
  } else if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Такой пользователь уже существует" }, { status: 409 });
  }

  const user = await prisma.adminUser.create({
    data: { email, passwordHash: hashPassword(password) },
  });

  if (adminCount === 0) {
    await setAdminSession(user.id);
  }

  return NextResponse.json({ ok: true });
}
