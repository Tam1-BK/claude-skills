import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE } from "@/lib/api-utils";
import { updateTenderSchema } from "@/lib/validations";

export const GET = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;

  const tender = await prisma.tender.findUnique({
    where: { id },
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
}, OPS_READ);

export const PATCH = withAuth(async (req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;
  const body = updateTenderSchema.parse(await req.json());

  const data: Record<string, unknown> = { ...body };
  if (body.deadline) data.deadline = new Date(body.deadline);

  const tender = await prisma.tender.update({
    where: { id },
    data: data as any,
  });

  return NextResponse.json(tender);
}, OPS_WRITE);

export const DELETE = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;
  await prisma.tender.delete({ where: { id } });
  return NextResponse.json({ success: true });
}, OPS_WRITE);
