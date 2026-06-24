import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE, auditLog, noStore } from "@/lib/api-utils";
import { updateTaskSchema } from "@/lib/validations";

export const GET = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      creator: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      tender: { select: { id: true, tenderName: true } },
      contract: { select: { id: true, title: true } },
      supplier: { select: { id: true, name: true } },
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return noStore(NextResponse.json(task));
}, OPS_READ);

export const PATCH = withAuth(async (req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  const body = updateTaskSchema.parse(await req.json());

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      completedAt: body.status === "DONE" ? new Date() : undefined,
    },
  });

  auditLog(session.user.id, "UPDATE", "task", id);
  return NextResponse.json(task);
}, OPS_WRITE);

export const DELETE = withAuth(async (_req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  await prisma.task.delete({ where: { id } });
  auditLog(session.user.id, "DELETE", "task", id);
  return NextResponse.json({ success: true });
}, OPS_WRITE);
