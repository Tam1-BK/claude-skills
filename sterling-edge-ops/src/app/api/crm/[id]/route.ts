import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE, auditLog, noStore } from "@/lib/api-utils";
import { updateClientSchema } from "@/lib/validations";

export const GET = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      contacts: true,
      tenders: { orderBy: { createdAt: "desc" }, take: 10 },
      contracts: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { supplier: { select: { name: true } } },
      },
      documents: { orderBy: { createdAt: "desc" } },
      tasks: {
        where: { status: { notIn: ["DONE", "CANCELLED"] } },
        orderBy: { dueDate: "asc" },
        include: { assignee: { select: { name: true } } },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return noStore(NextResponse.json(client));
}, OPS_READ);

export const PATCH = withAuth(async (req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  const body = updateClientSchema.parse(await req.json());

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.type != null && { type: body.type }),
      ...(body.registrationNumber !== undefined && { registrationNumber: body.registrationNumber }),
      ...(body.kraPin !== undefined && { kraPin: body.kraPin }),
      ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson }),
      ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail || null }),
      ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
      ...(body.physicalAddress !== undefined && { physicalAddress: body.physicalAddress }),
      ...(body.county !== undefined && { county: body.county }),
      ...(body.website !== undefined && { website: body.website || null }),
      ...(body.relationshipOwner != null && { relationshipOwner: body.relationshipOwner }),
      ...(body.opportunityValue !== undefined && { opportunityValue: body.opportunityValue }),
      ...(body.relationshipStatus != null && { relationshipStatus: body.relationshipStatus }),
      ...(body.pipelineStage != null && { pipelineStage: body.pipelineStage }),
      ...(body.priority != null && { priority: body.priority }),
      ...(body.tags != null && { tags: body.tags }),
      ...(body.nextFollowUp !== undefined && {
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      }),
    },
  });

  auditLog(session.user.id, "UPDATE", "client", id);
  return NextResponse.json(client);
}, OPS_WRITE);

export const DELETE = withAuth(async (_req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  await prisma.client.delete({ where: { id } });
  auditLog(session.user.id, "DELETE", "client", id);
  return NextResponse.json({ success: true });
}, OPS_WRITE);
