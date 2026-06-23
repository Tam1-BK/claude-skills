import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const client = await prisma.client.create({
    data: {
      name: body.name,
      type: body.type,
      registrationNumber: body.registrationNumber,
      kraPin: body.kraPin,
      contactPerson: body.contactPerson,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      physicalAddress: body.physicalAddress,
      county: body.county,
      website: body.website,
      relationshipOwner: body.relationshipOwner,
      ownerId: (session.user as any).id,
      nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      opportunityValue: body.opportunityValue ? parseFloat(body.opportunityValue) : null,
      relationshipStatus: body.relationshipStatus ?? "PROSPECT",
      pipelineStage: body.pipelineStage ?? "LEAD_IDENTIFIED",
      priority: body.priority ?? "MEDIUM",
      tags: body.tags ?? [],
    },
  });

  return NextResponse.json(client, { status: 201 });
}
