import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withAuth, ALL_ROLES, OPS_WRITE, auditLog, noStore,
  parsePagination, paginated,
} from "@/lib/api-utils";
import { createTaskSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const assigneeId = searchParams.get("assignee") ?? "";
  const pagination = parsePagination(searchParams);

  const where = {
    AND: [
      status ? { status: status as any } : { status: { notIn: ["DONE", "CANCELLED"] } as any },
      priority ? { priority: priority as any } : {},
      assigneeId ? { assigneeId } : {},
    ],
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true } },
        creator: { select: { name: true } },
        client: { select: { id: true, name: true } },
        tender: { select: { id: true, tenderName: true } },
        contract: { select: { id: true, title: true } },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.task.count({ where }),
  ]);

  return noStore(NextResponse.json(paginated(tasks, total, pagination)));
}, ALL_ROLES);

export const POST = withAuth(async (req: NextRequest, session) => {
  const body = createTaskSchema.parse(await req.json());

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "TODO",
      priority: body.priority ?? "MEDIUM",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      assigneeId: body.assigneeId ?? null,
      creatorId: session.user.id,
      clientId: body.clientId ?? null,
      tenderId: body.tenderId ?? null,
      contractId: body.contractId ?? null,
      supplierId: body.supplierId ?? null,
      notes: body.notes ?? null,
    },
  });

  auditLog(session.user.id, "CREATE", "task", task.id, { title: task.title });
  return NextResponse.json(task, { status: 201 });
}, OPS_WRITE);
