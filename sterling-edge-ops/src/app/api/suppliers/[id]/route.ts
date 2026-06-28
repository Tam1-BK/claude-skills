import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE, auditLog, noStore } from "@/lib/api-utils";
import { updateSupplierSchema } from "@/lib/validations";

export const GET = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      priceHistory: { orderBy: { date: "desc" } },
      contracts: { include: { client: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      notes_rel: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return noStore(NextResponse.json(supplier));
}, OPS_READ);

export const PATCH = withAuth(async (req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  const body = updateSupplierSchema.parse(await req.json());

  const supplier = await prisma.supplier.update({ where: { id }, data: { ...body } });
  auditLog(session.user.id, "UPDATE", "supplier", id);
  return NextResponse.json(supplier);
}, OPS_WRITE);

export const DELETE = withAuth(async (_req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  await prisma.supplier.update({ where: { id }, data: { active: false } });
  auditLog(session.user.id, "DELETE", "supplier", id);
  return NextResponse.json({ success: true });
}, OPS_WRITE);
