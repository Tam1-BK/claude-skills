import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      priceHistory: { orderBy: { date: "desc" } },
      contracts: { include: { client: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      notes_rel: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });

  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const supplier = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      ...body,
      leadTimeDays: body.leadTimeDays ? parseInt(body.leadTimeDays) : undefined,
      minimumOrderValue: body.minimumOrderValue ? parseFloat(body.minimumOrderValue) : undefined,
    },
  });

  return NextResponse.json(supplier);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.supplier.update({ where: { id: params.id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
