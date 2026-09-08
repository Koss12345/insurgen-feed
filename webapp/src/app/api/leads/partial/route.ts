import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isInsuranceType } from "@/lib/insurers/fields";

/**
 * Upserts a draft of the contact step so a manager can follow up even if
 * the visitor never hits "submit". Called (debounced) from the wizard as
 * the user types their contact details; no auth, since it's the visitor's
 * own in-progress data. Deleted once the real Application is created.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { id, type, params, quote, contact } = (body ?? {}) as {
    id?: unknown;
    type?: unknown;
    params?: unknown;
    quote?: { insurerId?: unknown; insurerName?: unknown; premium?: unknown } | null;
    contact?: { name?: unknown; phone?: unknown; email?: unknown } | null;
  };

  if (typeof type !== "string" || !isInsuranceType(type)) {
    return NextResponse.json({ error: "Неизвестный вид страхования" }, { status: 400 });
  }
  if (typeof params !== "object" || params === null) {
    return NextResponse.json({ error: "Некорректные параметры" }, { status: 400 });
  }

  const data = {
    type,
    params: JSON.stringify(params),
    insurerId: typeof quote?.insurerId === "string" ? quote.insurerId : null,
    insurerName: typeof quote?.insurerName === "string" ? quote.insurerName : null,
    premium: typeof quote?.premium === "number" ? quote.premium : null,
    contactName: typeof contact?.name === "string" && contact.name.trim() ? contact.name.trim() : null,
    contactPhone: typeof contact?.phone === "string" && contact.phone.trim() ? contact.phone.trim() : null,
    contactEmail: typeof contact?.email === "string" && contact.email.trim() ? contact.email.trim() : null,
  };

  // Nothing worth saving yet (visitor hasn't typed anything) — skip the write.
  if (!data.contactName && !data.contactPhone) {
    return NextResponse.json({ id: typeof id === "string" ? id : null });
  }

  if (typeof id === "string") {
    const updated = await prisma.partialLead.updateMany({ where: { id }, data });
    if (updated.count > 0) {
      return NextResponse.json({ id });
    }
  }

  const created = await prisma.partialLead.create({ data });
  return NextResponse.json({ id: created.id });
}
