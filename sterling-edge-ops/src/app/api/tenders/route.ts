import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withAuth, OPS_READ, OPS_WRITE, auditLog, noStore,
  parsePagination, paginated,
} from "@/lib/api-utils";
import { createTenderSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const decision = searchParams.get("decision") ?? "";
  const eligibility = searchParams.get("eligibility") ?? "";
  const pagination = parsePagination(searchParams);

  const where = {
    AND: [
      search ? {
        OR: [
          { tenderName: { contains: search, mode: "insensitive" as const } },
          { procuringEntity: { contains: search, mode: "insensitive" as const } },
          { tenderNumber: { contains: search, mode: "insensitive" as const } },
        ],
      } : {},
      stage ? { stage: stage as any } : {},
      decision ? { bidDecision: decision as any } : {},
      eligibility ? { eligibility: eligibility as any } : {},
    ],
  };

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany({
      where,
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true, documents: true } },
      },
      orderBy: [{ deadline: "asc" }],
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.tender.count({ where }),
  ]);

  return noStore(NextResponse.json(paginated(tenders, total, pagination)));
}, OPS_READ);

export const POST = withAuth(async (req: NextRequest, session) => {
  const body = createTenderSchema.parse(await req.json());

  const tender = await prisma.tender.create({
    data: {
      tenderName: body.tenderName,
      tenderNumber: body.tenderNumber ?? null,
      procuringEntity: body.procuringEntity,
      clientId: body.clientId ?? null,
      category: body.category ?? "",
      eligibility: body.eligibility ?? "OPEN",
      deadline: new Date(body.deadline),
      bidBondRequired: body.bidBondRequired ?? false,
      bidBondAmount: body.bidBondAmount ?? null,
      estimatedValue: body.estimatedValue ?? null,
      stage: body.stage ?? "IDENTIFIED",
      bidDecision: body.bidDecision ?? "PENDING",
      mandatoryDocuments: body.mandatoryDocuments ?? [],
      requiredLicenses: body.requiredLicenses ?? [],
      technicalRequirements: body.technicalRequirements ?? null,
      financialRequirements: body.financialRequirements ?? null,
      priority: body.priority ?? "MEDIUM",
      notes: body.notes ?? null,
      eligibilityScore: body.eligibilityScore ?? null,
      capitalScore: body.capitalScore ?? null,
      deadlineScore: body.deadlineScore ?? null,
      documentScore: body.documentScore ?? null,
      supplierScore: body.supplierScore ?? null,
      marginScore: body.marginScore ?? null,
      relationshipScore: body.relationshipScore ?? null,
      licenseScore: body.licenseScore ?? null,
      paymentRiskScore: body.paymentRiskScore ?? null,
    },
  });

  auditLog(session.user.id, "CREATE", "tender", tender.id, { tenderName: tender.tenderName });
  return NextResponse.json(tender, { status: 201 });
}, OPS_WRITE);
