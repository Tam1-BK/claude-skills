import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE, auditLog, noStore } from "@/lib/api-utils";
import { updateContactSchema } from "@/lib/validations";

export const GET = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true } } },
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return noStore(NextResponse.json(contact));
}, OPS_READ);

export const PATCH = withAuth(async (req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  const body = updateContactSchema.parse(await req.json());

  // If promoting to primary, demote existing primary in the same client
  if (body.isPrimary) {
    const existing = await prisma.contact.findUnique({ where: { id }, select: { clientId: true } });
    if (existing) {
      await prisma.contact.updateMany({
        where: { clientId: existing.clientId, isPrimary: true, id: { not: id } },
        data: { isPrimary: false },
      });
    }
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.department !== undefined && { department: body.department }),
      ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  auditLog(session.user.id, "UPDATE", "contact", id);
  return NextResponse.json(contact);
}, OPS_WRITE);

export const DELETE = withAuth(async (_req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  await prisma.contact.delete({ where: { id } });
  auditLog(session.user.id, "DELETE", "contact", id);
  return NextResponse.json({ success: true });
}, OPS_WRITE);
