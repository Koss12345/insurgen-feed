import { NextResponse } from "next/server";
import { isInsuranceType } from "@/lib/insurers/fields";
import { getQuotes } from "@/lib/insurers/registry";
import type { QuoteParamValue } from "@/lib/insurers/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { type, params } = body as { type?: unknown; params?: unknown };

  if (typeof type !== "string" || !isInsuranceType(type)) {
    return NextResponse.json({ error: "Неизвестный вид страхования" }, { status: 400 });
  }

  if (typeof params !== "object" || params === null || Array.isArray(params)) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const cleanParams: Record<string, QuoteParamValue> = {};
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      cleanParams[key] = value;
    }
  }

  const quotes = await getQuotes({ type, params: cleanParams });

  return NextResponse.json({ quotes });
}
