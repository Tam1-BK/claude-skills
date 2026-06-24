import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE, auditLog, noStore } from "@/lib/api-utils";
import { createContactSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") ?? "";

  const contacts = await prisma.contact.findMany({
    where: clientId ? { clientId } : {},
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return noStore(NextResponse.json(contacts));
}, OPS_READ);

export const POST = withAuth(async (req: NextRequest, session) => {
  const body = createContactSchema.parse(await req.json());

  // If this contact is set as primary, clear existing primary flag for this client
  if (body.isPrimary) {
    await prisma.contact.updateMany({
      where: { clientId: body.clientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contact.create({
    data: {
      clientId: body.clientId,
      name: body.name,
      title: body.title ?? null,
      email: body.email || null,
      phone: body.phone ?? null,
      department: body.department ?? null,
      isPrimary: body.isPrimary ?? false,
      notes: body.notes ?? null,
    },
  });

  auditLog(session.user.id, "CREATE", "contact", contact.id, { name: contact.name, clientId: contact.clientId });
  return NextResponse.json(contact, { status: 201 });
}, OPS_WRITE);
