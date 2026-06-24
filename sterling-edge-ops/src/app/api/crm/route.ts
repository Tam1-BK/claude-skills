import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE } from "@/lib/api-utils";
import { createClientSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";

  const clients = await prisma.client.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
            { county: { contains: search, mode: "insensitive" } },
          ],
        } : {},
        stage ? { pipelineStage: stage as any } : {},
        type ? { type: type as any } : {},
        status ? { relationshipStatus: status as any } : {},
      ],
    },
    include: {
      owner: { select: { name: true } },
      contacts: { take: 3 },
      _count: { select: { tenders: true, contracts: true, tasks: true } },
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(clients);
}, OPS_READ);

export const POST = withAuth(async (req: NextRequest, session) => {
  const body = createClientSchema.parse(await req.json());

  const client = await prisma.client.create({
    data: {
      name: body.name,
      type: body.type,
      registrationNumber: body.registrationNumber ?? null,
      kraPin: body.kraPin ?? null,
      contactPerson: body.contactPerson ?? null,
      contactEmail: body.contactEmail || null,
      contactPhone: body.contactPhone ?? null,
      physicalAddress: body.physicalAddress ?? null,
      county: body.county ?? null,
      website: body.website || null,
      relationshipOwner: body.relationshipOwner ?? "",
      ownerId: session.user.id,
      nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      opportunityValue: body.opportunityValue ?? null,
      relationshipStatus: body.relationshipStatus ?? "PROSPECT",
      pipelineStage: body.pipelineStage ?? "LEAD_IDENTIFIED",
      priority: body.priority ?? "MEDIUM",
      tags: body.tags ?? [],
    },
  });

  return NextResponse.json(client, { status: 201 });
}, OPS_WRITE);
