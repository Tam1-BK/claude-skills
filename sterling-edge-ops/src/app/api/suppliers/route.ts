import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const supplier = await prisma.supplier.create({
    data: {
      name: body.name,
      registrationNumber: body.registrationNumber,
      kraPin: body.kraPin,
      category: body.category,
      subcategory: body.subcategory,
      contactPerson: body.contactPerson,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      physicalAddress: body.physicalAddress,
      county: body.county,
      website: body.website,
      reliability: body.reliability ?? "GOOD",
      deliveryCapacity: body.deliveryCapacity,
      creditTerms: body.creditTerms,
      paymentTerms: body.paymentTerms,
      leadTimeDays: body.leadTimeDays ? parseInt(body.leadTimeDays) : null,
      minimumOrderValue: body.minimumOrderValue ? parseFloat(body.minimumOrderValue) : null,
      pastPerformance: body.pastPerformance,
      requiredCerts: body.requiredCerts ?? [],
      tags: body.tags ?? [],
      notes: body.notes,
    },
  });

  return NextResponse.json(supplier, { status: 201 });
}
