import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, CONTRACTS_READ, CONTRACTS_WRITE } from "@/lib/api-utils";
import { createContractSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
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
}, CONTRACTS_READ);

export const POST = withAuth(async (req: NextRequest) => {
  const body = createContractSchema.parse(await req.json());

  const contractValue = Number(body.contractValue);
  const costOfGoods = Number(body.costOfGoods ?? 0);
  const logisticsCost = Number(body.logisticsCost ?? 0);
  const otherCosts = Number(body.otherCosts ?? 0);
  const totalCost = costOfGoods + logisticsCost + otherCosts;
  const grossMargin = contractValue > 0 ? ((contractValue - totalCost) / contractValue) * 100 : 0;
  const expectedProfit = contractValue - totalCost;
  const workingCapital = totalCost;
  const financingAmount = Number(body.financingAmount ?? 0);
  const financingGap = Math.max(0, workingCapital - financingAmount);

  const contract = await prisma.contract.create({
    data: {
      title: body.title,
      contractNumber: body.contractNumber ?? null,
      clientId: body.clientId,
      supplierId: body.supplierId ?? null,
      tenderId: body.tenderId ?? null,
      contractValue,
      costOfGoods: costOfGoods || null,
      logisticsCost: logisticsCost || null,
      otherCosts: otherCosts || null,
      marginEstimate: body.marginEstimate ?? null,
      grossMargin,
      deliveryDeadline: body.deliveryDeadline ? new Date(body.deliveryDeadline) : null,
      paymentTerms: body.paymentTerms ?? null,
      expectedPaymentDate: body.expectedPaymentDate ? new Date(body.expectedPaymentDate) : null,
      supplierPaymentDate: body.supplierPaymentDate ? new Date(body.supplierPaymentDate) : null,
      financingRequired: body.financingRequired ?? false,
      financingAmount: financingAmount || null,
      workingCapital,
      financingGap,
      status: body.status ?? "AWARDED",
      riskLevel: body.riskLevel ?? "MEDIUM",
      expectedProfit,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(contract, { status: 201 });
}, CONTRACTS_WRITE);
