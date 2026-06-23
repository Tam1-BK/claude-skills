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
  const decision = searchParams.get("decision") ?? "";
  const eligibility = searchParams.get("eligibility") ?? "";

  const tenders = await prisma.tender.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { tenderName: { contains: search, mode: "insensitive" } },
            { procuringEntity: { contains: search, mode: "insensitive" } },
            { tenderNumber: { contains: search, mode: "insensitive" } },
          ],
        } : {},
        stage ? { stage: stage as any } : {},
        decision ? { bidDecision: decision as any } : {},
        eligibility ? { eligibility: eligibility as any } : {},
      ],
    },
    include: {
      client: { select: { name: true } },
      _count: { select: { tasks: true, documents: true } },
    },
    orderBy: [{ deadline: "asc" }],
  });

  return NextResponse.json(tenders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const tender = await prisma.tender.create({
    data: {
      tenderName: body.tenderName,
      tenderNumber: body.tenderNumber,
      procuringEntity: body.procuringEntity,
      clientId: body.clientId || null,
      category: body.category,
      eligibility: body.eligibility ?? "OPEN",
      deadline: new Date(body.deadline),
      bidBondRequired: body.bidBondRequired ?? false,
      bidBondAmount: body.bidBondAmount ? parseFloat(body.bidBondAmount) : null,
      estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
      stage: body.stage ?? "IDENTIFIED",
      bidDecision: body.bidDecision ?? "PENDING",
      mandatoryDocuments: body.mandatoryDocuments ?? [],
      requiredLicenses: body.requiredLicenses ?? [],
      technicalRequirements: body.technicalRequirements,
      financialRequirements: body.financialRequirements,
      priority: body.priority ?? "MEDIUM",
      notes: body.notes,
      // Bid scores
      eligibilityScore: body.eligibilityScore ? parseInt(body.eligibilityScore) : null,
      capitalScore: body.capitalScore ? parseInt(body.capitalScore) : null,
      deadlineScore: body.deadlineScore ? parseInt(body.deadlineScore) : null,
      documentScore: body.documentScore ? parseInt(body.documentScore) : null,
      supplierScore: body.supplierScore ? parseInt(body.supplierScore) : null,
      marginScore: body.marginScore ? parseInt(body.marginScore) : null,
      relationshipScore: body.relationshipScore ? parseInt(body.relationshipScore) : null,
      licenseScore: body.licenseScore ? parseInt(body.licenseScore) : null,
      paymentRiskScore: body.paymentRiskScore ? parseInt(body.paymentRiskScore) : null,
    },
  });

  return NextResponse.json(tender, { status: 201 });
}
