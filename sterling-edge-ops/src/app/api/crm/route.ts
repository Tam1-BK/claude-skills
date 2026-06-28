import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withAuth, OPS_READ, OPS_WRITE, auditLog, noStore,
  parsePagination, paginated,
} from "@/lib/api-utils";
import { createClientSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const type = searchParams.get("type") ?? "";
  const status = searchParams.get("status") ?? "";
  const pagination = parsePagination(searchParams);

  const where = {
    AND: [
      search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { contactPerson: { contains: search, mode: "insensitive" as const } },
          { county: { contains: search, mode: "insensitive" as const } },
        ],
      } : {},
      stage ? { pipelineStage: stage as any } : {},
      type ? { type: type as any } : {},
      status ? { relationshipStatus: status as any } : {},
    ],
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        owner: { select: { name: true } },
        contacts: { take: 3 },
        _count: { select: { tenders: true, contracts: true, tasks: true } },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.client.count({ where }),
  ]);

  return noStore(NextResponse.json(paginated(clients, total, pagination)));
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

  auditLog(session.user.id, "CREATE", "client", client.id, { name: client.name });
  return NextResponse.json(client, { status: 201 });
}, OPS_WRITE);
