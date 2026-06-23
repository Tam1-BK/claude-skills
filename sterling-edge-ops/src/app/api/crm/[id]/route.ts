import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      contacts: true,
      tenders: { orderBy: { createdAt: "desc" }, take: 10 },
      contracts: { orderBy: { createdAt: "desc" }, take: 10, include: { supplier: { select: { name: true } } } },
      documents: { orderBy: { createdAt: "desc" } },
      tasks: { where: { status: { notIn: ["DONE", "CANCELLED"] } }, orderBy: { dueDate: "asc" }, include: { assignee: { select: { name: true } } } },
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      ...body,
      nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : undefined,
      lastInteraction: body.lastInteraction ? new Date(body.lastInteraction) : undefined,
      opportunityValue: body.opportunityValue != null ? parseFloat(body.opportunityValue) : undefined,
    },
  });

  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.client.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
