"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText, Users, ClipboardList, CheckSquare, DollarSign,
  AlertTriangle, TrendingUp, Clock, ArrowRight, Calendar
} from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isDueSoon, isOverdue, formatMillions } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardData {
  stats: {
    activeTenders: number;
    tendersDueSoon: number;
    activeContracts: number;
    pendingPayments: number;
    totalPipelineValue: number;
    totalContractValue: number;
    cashExposure: number;
    tasksToday: number;
    overdueTasksCount: number;
    wonContracts: number;
  };
  recentTasks: any[];
  urgentTenders: any[];
  activeContractList: any[];
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, recentTasks, urgentTenders, activeContractList } = data;

  const statCards = [
    {
      label: "Active Tenders",
      value: stats.activeTenders,
      sub: `${stats.tendersDueSoon} due this week`,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/tenders",
      alert: stats.tendersDueSoon > 0,
    },
    {
      label: "Pipeline Value",
      value: `KES ${formatMillions(stats.totalPipelineValue)}`,
      sub: "Active CRM opportunities",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/crm",
    },
    {
      label: "Active Contracts",
      value: stats.activeContracts,
      sub: `${stats.wonContracts} paid/closed`,
      icon: ClipboardList,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/contracts",
    },
    {
      label: "Cash Exposure",
      value: `KES ${formatMillions(stats.cashExposure)}`,
      sub: "Working capital deployed",
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/finance",
      alert: stats.cashExposure > 5000000,
    },
    {
      label: "Tasks Today",
      value: stats.tasksToday,
      sub: `${stats.overdueTasksCount} overdue`,
      icon: CheckSquare,
      color: "text-teal-600",
      bg: "bg-teal-50",
      href: "/tasks",
      alert: stats.overdueTasksCount > 0,
    },
    {
      label: "Pending Payments",
      value: stats.pendingPayments,
      sub: "Awaiting collection",
      icon: AlertTriangle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      href: "/finance",
      alert: stats.pendingPayments > 0,
    },
    {
      label: "Contract Value",
      value: `KES ${formatMillions(stats.totalContractValue)}`,
      sub: "Active contract portfolio",
      icon: ClipboardList,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: "/contracts",
    },
    {
      label: "Won Contracts",
      value: stats.wonContracts,
      sub: "Paid & closed",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/contracts",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={cn("p-2 rounded-lg", card.bg)}>
                    <card.icon className={cn("h-5 w-5", card.color)} />
                  </div>
                  {card.alert && (
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-foreground">{card.value}</div>
                  <div className="text-xs font-medium text-muted-foreground mt-0.5">{card.label}</div>
                  <div className={cn("text-xs mt-1", card.alert ? "text-red-600 font-medium" : "text-muted-foreground")}>
                    {card.sub}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Tenders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Active Tender Deadlines</CardTitle>
                <Link href="/tenders" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {urgentTenders.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">No active tenders</div>
                ) : (
                  urgentTenders.map((tender: any) => {
                    const overdue = isOverdue(tender.deadline);
                    const soon = isDueSoon(tender.deadline, 7);
                    return (
                      <Link key={tender.id} href={`/tenders/${tender.id}`}>
                        <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{tender.tenderName}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {tender.procuringEntity} · {tender.tenderNumber}
                            </div>
                          </div>
                          <div className="ml-4 text-right shrink-0">
                            <div className={cn(
                              "text-xs font-medium",
                              overdue ? "text-red-600" : soon ? "text-orange-600" : "text-muted-foreground"
                            )}>
                              {overdue ? "OVERDUE" : formatDate(tender.deadline)}
                            </div>
                            <div className="mt-1">
                              <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(tender.stage))}>
                                {formatLabel(tender.stage)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Due */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Tasks Due</CardTitle>
              <Link href="/tasks" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentTasks.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">No pending tasks</div>
              ) : (
                recentTasks.slice(0, 7).map((task: any) => {
                  const overdue = isOverdue(task.dueDate);
                  return (
                    <Link key={task.id} href="/tasks">
                      <div className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                        <div className={cn(
                          "mt-0.5 h-2 w-2 rounded-full shrink-0",
                          task.priority === "URGENT" ? "bg-red-500" :
                          task.priority === "HIGH" ? "bg-orange-500" :
                          task.priority === "MEDIUM" ? "bg-yellow-500" : "bg-gray-300"
                        )} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium leading-tight">{task.title}</div>
                          {task.dueDate && (
                            <div className={cn("text-xs mt-0.5", overdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                              <Calendar className="inline h-3 w-3 mr-0.5" />
                              {overdue ? "Overdue · " : ""}{formatDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                        <span className={cn("shrink-0 text-xs rounded px-1.5 py-0.5", getStatusColor(task.status))}>
                          {formatLabel(task.status)}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Contracts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Active Contracts & Orders</CardTitle>
            <Link href="/contracts" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Contract</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Client</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Value</th>
                  <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Deadline</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeContractList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground text-sm">
                      No active contracts
                    </td>
                  </tr>
                ) : (
                  activeContractList.map((contract: any) => (
                    <tr key={contract.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/contracts/${contract.id}`} className="font-medium hover:text-blue-600 transition-colors">
                          {contract.title}
                        </Link>
                        {contract.contractNumber && (
                          <div className="text-xs text-muted-foreground">{contract.contractNumber}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 hidden md:table-cell text-muted-foreground">
                        {contract.client?.name}
                      </td>
                      <td className="px-3 py-3 text-right font-medium">
                        {formatCurrency(contract.contractValue)}
                      </td>
                      <td className="px-3 py-3 hidden lg:table-cell">
                        <span className={cn(
                          "text-xs",
                          isOverdue(contract.deliveryDeadline) ? "text-red-600 font-medium" :
                          isDueSoon(contract.deliveryDeadline, 14) ? "text-orange-600" : "text-muted-foreground"
                        )}>
                          {formatDate(contract.deliveryDeadline)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(contract.status))}>
                          {formatLabel(contract.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
