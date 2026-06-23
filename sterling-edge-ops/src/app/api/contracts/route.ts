import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const contracts = await prisma.contract.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { contractNumber: { contains: search, mode: "insensitive" } },
          ],
        } : {},
        status ? { status: status as any } : {},
      ],
    },
    include: {
      client: { select: { name: true } },
      supplier: { select: { name: true } },
      payments: { orderBy: { dueDate: "asc" } },
    },
    orderBy: [{ deliveryDeadline: "asc" }],
  });

  return NextResponse.json(contracts);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const contractValue = parseFloat(body.contractValue ?? 0);
  const costOfGoods = parseFloat(body.costOfGoods ?? 0);
  const logisticsCost = parseFloat(body.logisticsCost ?? 0);
  const otherCosts = parseFloat(body.otherCosts ?? 0);
  const totalCost = costOfGoods + logisticsCost + otherCosts;
  const grossMargin = contractValue > 0 ? ((contractValue - totalCost) / contractValue) * 100 : 0;
  const expectedProfit = contractValue - totalCost;
  const workingCapital = totalCost;
  const financingAmount = parseFloat(body.financingAmount ?? 0);
  const financingGap = Math.max(0, workingCapital - financingAmount);

  const contract = await prisma.contract.create({
    data: {
      title: body.title,
      contractNumber: body.contractNumber,
      clientId: body.clientId,
      supplierId: body.supplierId || null,
      tenderId: body.tenderId || null,
      contractValue,
      costOfGoods: costOfGoods || null,
      logisticsCost: logisticsCost || null,
      otherCosts: otherCosts || null,
      marginEstimate: body.marginEstimate ? parseFloat(body.marginEstimate) : null,
      grossMargin,
      deliveryDeadline: body.deliveryDeadline ? new Date(body.deliveryDeadline) : null,
      paymentTerms: body.paymentTerms,
      expectedPaymentDate: body.expectedPaymentDate ? new Date(body.expectedPaymentDate) : null,
      supplierPaymentDate: body.supplierPaymentDate ? new Date(body.supplierPaymentDate) : null,
      financingRequired: body.financingRequired ?? false,
      financingAmount: financingAmount || null,
      workingCapital,
      financingGap,
      status: body.status ?? "AWARDED",
      riskLevel: body.riskLevel ?? "MEDIUM",
      expectedProfit,
      notes: body.notes,
    },
  });

  return NextResponse.json(contract, { status: 201 });
}
