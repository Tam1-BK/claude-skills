import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, OPS_READ, OPS_WRITE } from "@/lib/api-utils";
import { createSupplierSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const reliability = searchParams.get("reliability") ?? "";

  const suppliers = await prisma.supplier.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
          ],
        } : {},
        reliability ? { reliability: reliability as any } : {},
        { active: true },
      ],
    },
    include: {
      priceHistory: { orderBy: { date: "desc" }, take: 3 },
      _count: { select: { contracts: true } },
    },
    orderBy: [{ reliability: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(suppliers);
}, OPS_READ);

export const POST = withAuth(async (req: NextRequest) => {
  const body = createSupplierSchema.parse(await req.json());

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      registrationNumber: body.registrationNumber ?? null,
      kraPin: body.kraPin ?? null,
      category: body.category,
      subcategory: body.subcategory ?? null,
      contactPerson: body.contactPerson ?? null,
      contactEmail: body.contactEmail || null,
      contactPhone: body.contactPhone ?? null,
      physicalAddress: body.physicalAddress ?? null,
      county: body.county ?? null,
      website: body.website || null,
      reliability: body.reliability ?? "GOOD",
      deliveryCapacity: body.deliveryCapacity ?? null,
      creditTerms: body.creditTerms ?? null,
      paymentTerms: body.paymentTerms ?? null,
      leadTimeDays: body.leadTimeDays ?? null,
      minimumOrderValue: body.minimumOrderValue ?? null,
      pastPerformance: body.pastPerformance ?? null,
      requiredCerts: body.requiredCerts ?? [],
      tags: body.tags ?? [],
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}, OPS_WRITE);
