import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, FINANCE_READ } from "@/lib/api-utils";

export const GET = withAuth(async () => {
  const contracts = await prisma.contract.findMany({
    include: {
      client: { select: { name: true } },
      supplier: { select: { name: true } },
      payments: true,
    },
    orderBy: { expectedPaymentDate: "asc" },
  });

  const totalRevenue = contracts.reduce((s, c) => s + c.contractValue, 0);
  const totalCost = contracts.reduce(
    (s, c) => s + (c.costOfGoods ?? 0) + (c.logisticsCost ?? 0) + (c.otherCosts ?? 0),
    0
  );
  const totalProfit = contracts.reduce((s, c) => s + (c.expectedProfit ?? 0), 0);
  const totalExposure = contracts
    .filter((c) => !["PAID", "CLOSED"].includes(c.status))
    .reduce((s, c) => s + (c.workingCapital ?? 0), 0);
  const totalFinancingGap = contracts
    .filter((c) => !["PAID", "CLOSED"].includes(c.status))
    .reduce((s, c) => s + (c.financingGap ?? 0), 0);
  const pendingPayments = contracts
    .filter((c) => !["PAID", "CLOSED"].includes(c.status))
    .reduce((s, c) => s + c.contractValue, 0);

  return NextResponse.json({
    contracts,
    summary: {
      totalRevenue,
      totalCost,
      totalProfit,
      totalExposure,
      totalFinancingGap,
      pendingPayments,
      avgMargin:
        contracts.length > 0
          ? contracts.reduce((s, c) => s + (c.grossMargin ?? 0), 0) / contracts.length
          : 0,
    },
  });
}, FINANCE_READ);
