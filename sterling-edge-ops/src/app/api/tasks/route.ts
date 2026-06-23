import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const assigneeId = searchParams.get("assignee") ?? "";

  const tasks = await prisma.task.findMany({
    where: {
      AND: [
        status ? { status: status as any } : { status: { notIn: ["DONE", "CANCELLED"] } },
        priority ? { priority: priority as any } : {},
        assigneeId ? { assigneeId } : {},
      ],
    },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { name: true } },
      client: { select: { id: true, name: true } },
      tender: { select: { id: true, tenderName: true } },
      contract: { select: { id: true, title: true } },
    },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      status: body.status ?? "TODO",
      priority: body.priority ?? "MEDIUM",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assigneeId: body.assigneeId || null,
      creatorId: userId,
      clientId: body.clientId || null,
      tenderId: body.tenderId || null,
      contractId: body.contractId || null,
      supplierId: body.supplierId || null,
      notes: body.notes,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
