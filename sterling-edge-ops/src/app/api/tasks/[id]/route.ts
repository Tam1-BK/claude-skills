import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_WRITE, auditLog } from "@/lib/api-utils";
import { updateTaskSchema } from "@/lib/validations";

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
