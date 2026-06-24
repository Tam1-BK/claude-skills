import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, CONTRACTS_READ, CONTRACTS_WRITE, auditLog, noStore } from "@/lib/api-utils";
import { updateContractSchema } from "@/lib/validations";

export const GET = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;

  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      client: true,
      supplier: true,
      documents: { orderBy: { createdAt: "desc" } },
      tasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        include: { assignee: { select: { name: true } } },
      },
      notes_rel: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return noStore(NextResponse.json(contract));
}, CONTRACTS_READ);

export const PATCH = withAuth(async (req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  const body = updateContractSchema.parse(await req.json());

  const data: Record<string, unknown> = { ...body };
  if (body.deliveryDeadline) data.deliveryDeadline = new Date(body.deliveryDeadline);
  if (body.expectedPaymentDate) data.expectedPaymentDate = new Date(body.expectedPaymentDate);
  if (body.supplierPaymentDate) data.supplierPaymentDate = new Date(body.supplierPaymentDate);
  if (body.contractValue != null) data.contractValue = Number(body.contractValue);

  const contract = await prisma.contract.update({ where: { id }, data: data as any });
  auditLog(session.user.id, "UPDATE", "contract", id);
  return NextResponse.json(contract);
}, CONTRACTS_WRITE);
