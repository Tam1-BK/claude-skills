import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tender = await prisma.tender.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      documents: { orderBy: { createdAt: "desc" } },
      tasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        orderBy: { dueDate: "asc" },
        include: { assignee: { select: { name: true } } },
      },
      notes_rel: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!tender) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tender);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const tender = await prisma.tender.update({
    where: { id: params.id },
    data: {
      ...body,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      submittedAt: body.submittedAt ? new Date(body.submittedAt) : undefined,
      estimatedValue: body.estimatedValue != null ? parseFloat(body.estimatedValue) : undefined,
      bidBondAmount: body.bidBondAmount != null ? parseFloat(body.bidBondAmount) : undefined,
    },
  });

  return NextResponse.json(tender);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.tender.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
