import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      supplier: true,
      documents: { orderBy: { createdAt: "desc" } },
      tasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } }, include: { assignee: { select: { name: true } } } },
      notes_rel: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const contract = await prisma.contract.update({
    where: { id: params.id },
    data: {
      ...body,
      deliveryDeadline: body.deliveryDeadline ? new Date(body.deliveryDeadline) : undefined,
      expectedPaymentDate: body.expectedPaymentDate ? new Date(body.expectedPaymentDate) : undefined,
      supplierPaymentDate: body.supplierPaymentDate ? new Date(body.supplierPaymentDate) : undefined,
      contractValue: body.contractValue ? parseFloat(body.contractValue) : undefined,
      costOfGoods: body.costOfGoods ? parseFloat(body.costOfGoods) : undefined,
    },
  });

  return NextResponse.json(contract);
}
