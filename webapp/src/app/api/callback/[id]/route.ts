import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";

const VALID_STATUSES = ["new", "contacted", "cancelled"];

export async function PATCH(request: Request, ctx: RouteContext<"/api/callback/[id]">) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;
  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
  }

  try {
    await prisma.callbackRequest.update({ where: { id }, data: { status } });
  } catch {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
