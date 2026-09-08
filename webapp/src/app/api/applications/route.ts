import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isInsuranceType } from "@/lib/insurers/fields";

interface ApplicationPayload {
  type: string;
  params: Record<string, unknown>;
  quote: {
    insurerId: string;
    insurerName: string;
    premium: number;
    coverageSummary: string;
  };
  contact: {
    name: string;
    phone: string;
    email?: string;
  };
  consent: boolean;
}

function isValidPayload(body: unknown): body is ApplicationPayload {
  if (typeof body !== "object" || body === null) return false;
  const { type, params, quote, contact, consent } = body as Record<string, unknown>;

  if (typeof type !== "string" || !isInsuranceType(type)) return false;
  if (typeof params !== "object" || params === null) return false;
  if (typeof quote !== "object" || quote === null) return false;
  if (typeof contact !== "object" || contact === null) return false;
  if (consent !== true) return false;

  const q = quote as Record<string, unknown>;
  if (typeof q.insurerId !== "string" || typeof q.insurerName !== "string") return false;
  if (typeof q.premium !== "number" || !Number.isFinite(q.premium)) return false;
  if (typeof q.coverageSummary !== "string") return false;

  const c = contact as Record<string, unknown>;
  if (typeof c.name !== "string" || c.name.trim().length < 2) return false;
  if (typeof c.phone !== "string" || c.phone.trim().length < 5) return false;
  if (c.email !== undefined && typeof c.email !== "string") return false;

  return true;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Заполните все обязательные поля и согласие" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      type: body.type,
      params: JSON.stringify(body.params),
      insurerId: body.quote.insurerId,
      insurerName: body.quote.insurerName,
      premium: body.quote.premium,
      coverageSummary: body.quote.coverageSummary,
      contactName: body.contact.name.trim(),
      contactPhone: body.contact.phone.trim(),
      contactEmail: body.contact.email?.trim() || null,
      consent: true,
    },
  });

  return NextResponse.json({ id: application.id });
}
