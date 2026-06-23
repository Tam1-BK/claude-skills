import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contracts = await prisma.contract.findMany({
    include: {
      client: { select: { name: true } },
      supplier: { select: { name: true } },
      payments: true,
    },
    orderBy: { expectedPaymentDate: "asc" },
  });

  const totalRevenue = contracts.reduce((s, c) => s + c.contractValue, 0);
  const totalCost = contracts.reduce((s, c) => s + (c.costOfGoods ?? 0) + (c.logisticsCost ?? 0) + (c.otherCosts ?? 0), 0);
  const totalProfit = contracts.reduce((s, c) => s + (c.expectedProfit ?? 0), 0);
  const totalExposure = contracts
    .filter(c => !["PAID", "CLOSED"].includes(c.status))
    .reduce((s, c) => s + (c.workingCapital ?? 0), 0);
  const totalFinancingGap = contracts
    .filter(c => !["PAID", "CLOSED"].includes(c.status))
    .reduce((s, c) => s + (c.financingGap ?? 0), 0);
  const pendingPayments = contracts
    .filter(c => !["PAID", "CLOSED"].includes(c.status))
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
      avgMargin: contracts.length > 0
        ? contracts.reduce((s, c) => s + (c.grossMargin ?? 0), 0) / contracts.length
        : 0,
    },
  });
}
