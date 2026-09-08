import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";
import { notifyNewLead } from "@/lib/notify";

export async function POST(request: Request) {
  if (isRateLimited(`callback:${getClientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Слишком много заявок. Попробуйте позже." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { name, phone, comment, website } = (body ?? {}) as {
    name?: unknown;
    phone?: unknown;
    comment?: unknown;
    website?: unknown; // honeypot
  };

  if (typeof website === "string" && website) {
    return NextResponse.json({ ok: true });
  }

  if (typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
  }
  if (typeof phone !== "string" || phone.trim().length < 5) {
    return NextResponse.json({ error: "Укажите телефон" }, { status: 400 });
  }

  await prisma.callbackRequest.create({
    data: {
      name: name.trim(),
      phone: phone.trim(),
      comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
    },
  });

  await notifyNewLead(`Заказан звонок: ${name.trim()}, ${phone.trim()}`);

  return NextResponse.json({ ok: true });
}
