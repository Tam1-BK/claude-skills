import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const sevenDays = new Date(today);
  sevenDays.setDate(today.getDate() + 7);

  const [
    activeTenders,
    tendersDueSoon,
    activeContracts,
    pendingPayments,
    pipelineClients,
    tasksToday,
    overdueTasks,
    wonContracts,
    contractValues,
    recentTasks,
    urgentTenders,
    activeContractList,
  ] = await Promise.all([
    prisma.tender.count({
      where: {
        stage: {
          notIn: ["WON", "LOST", "DECLINED"],
        },
      },
    }),
    prisma.tender.count({
      where: {
        deadline: { lte: sevenDays, gte: today },
        stage: { notIn: ["SUBMITTED", "AWAITING_AWARD", "WON", "LOST", "DECLINED"] },
      },
    }),
    prisma.contract.count({
      where: { status: { notIn: ["PAID", "CLOSED"] } },
    }),
    prisma.payment.count({
      where: { status: { in: ["PENDING", "OVERDUE"] } },
    }),
    prisma.client.aggregate({
      _sum: { opportunityValue: true },
      where: { pipelineStage: { notIn: ["WON", "LOST", "DORMANT"] } },
    }),
    prisma.task.count({
      where: {
        dueDate: { gte: today, lte: todayEnd },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    prisma.task.count({
      where: {
        dueDate: { lt: today },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
    }),
    prisma.contract.count({ where: { status: "PAID" } }),
    prisma.contract.aggregate({
      _sum: { contractValue: true, workingCapital: true },
      where: { status: { notIn: ["PAID", "CLOSED"] } },
    }),
    prisma.task.findMany({
      where: { status: { notIn: ["DONE", "CANCELLED"] } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 8,
      include: { assignee: { select: { name: true } }, client: { select: { name: true } }, tender: { select: { tenderName: true } } },
    }),
    prisma.tender.findMany({
      where: {
        deadline: { gte: today },
        stage: { notIn: ["SUBMITTED", "AWAITING_AWARD", "WON", "LOST", "DECLINED"] },
        bidDecision: "PURSUE",
      },
      orderBy: { deadline: "asc" },
      take: 6,
      include: { client: { select: { name: true } } },
    }),
    prisma.contract.findMany({
      where: { status: { notIn: ["PAID", "CLOSED"] } },
      orderBy: { deliveryDeadline: "asc" },
      take: 6,
      include: {
        client: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: {
      activeTenders,
      tendersDueSoon,
      activeContracts,
      pendingPayments,
      totalPipelineValue: pipelineClients._sum.opportunityValue ?? 0,
      totalContractValue: contractValues._sum.contractValue ?? 0,
      cashExposure: contractValues._sum.workingCapital ?? 0,
      tasksToday,
      overdueTasksCount: overdueTasks,
      wonContracts,
    },
    recentTasks,
    urgentTenders,
    activeContractList,
  });
}
