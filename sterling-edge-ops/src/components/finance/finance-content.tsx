"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, DollarSign, ArrowDownRight, ArrowUpRight } from "lucide-react";

export function FinanceContent() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/finance").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { contracts, summary } = data;
  const active = contracts.filter((c: any) => !["PAID", "CLOSED"].includes(c.status));
  const closed = contracts.filter((c: any) => ["PAID", "CLOSED"].includes(c.status));

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
            <div className="font-bold text-lg">{formatCurrency(summary.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
            <div className="font-bold text-lg text-orange-700">{formatCurrency(summary.totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Gross Profit</div>
            <div className="font-bold text-lg text-green-700">{formatCurrency(summary.totalProfit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Avg Margin</div>
            <div className={cn("font-bold text-lg", summary.avgMargin > 20 ? "text-green-700" : "text-yellow-700")}>
              {summary.avgMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Cash Exposure</div>
            <div className="font-bold text-lg text-orange-700">{formatCurrency(summary.totalExposure)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Financing Gap</div>
            <div className={cn("font-bold text-lg", summary.totalFinancingGap > 0 ? "text-red-700" : "text-green-700")}>
              {formatCurrency(summary.totalFinancingGap)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financing gap warning */}
      {summary.totalFinancingGap > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800 text-sm">Financing Gap Alert</div>
            <div className="text-sm text-red-700 mt-1">
              You have a financing gap of <strong>{formatCurrency(summary.totalFinancingGap)}</strong> across active contracts.
              Arrange bridging finance or negotiate extended supplier credit terms before commitment deadlines.
            </div>
          </div>
        </div>
      )}

      {/* Active Contracts Finance Detail */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Active Contracts — Finance Detail</h2>
        <div className="space-y-3">
          {active.map((contract: any) => {
            const paymentOverdue = isOverdue(contract.expectedPaymentDate);
            const paymentSoon = isDueSoon(contract.expectedPaymentDate, 14);
            const totalCost = (contract.costOfGoods ?? 0) + (contract.logisticsCost ?? 0) + (contract.otherCosts ?? 0);

            return (
              <div key={contract.id} className="border rounded-lg p-5 bg-white">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-sm">{contract.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {contract.client?.name}
                      {contract.supplier && ` · via ${contract.supplier.name}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(contract.riskLevel))}>
                      {contract.riskLevel} RISK
                    </span>
                    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(contract.status))}>
                      {formatLabel(contract.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                    <div className="font-semibold text-sm mt-0.5">{formatCurrency(contract.contractValue)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Cost</div>
                    <div className="font-semibold text-sm mt-0.5 text-orange-700">{formatCurrency(totalCost)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Gross Margin</div>
                    <div className={cn(
                      "font-semibold text-sm mt-0.5",
                      (contract.grossMargin ?? 0) > 20 ? "text-green-700" :
                      (contract.grossMargin ?? 0) > 10 ? "text-yellow-700" : "text-red-700"
                    )}>
                      {contract.grossMargin != null ? `${contract.grossMargin.toFixed(1)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Expected Profit</div>
                    <div className="font-semibold text-sm mt-0.5 text-green-700">
                      {formatCurrency(contract.expectedProfit ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Working Capital</div>
                    <div className="font-semibold text-sm mt-0.5 text-orange-700">
                      {formatCurrency(contract.workingCapital ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Financing Gap</div>
                    <div className={cn(
                      "font-semibold text-sm mt-0.5",
                      (contract.financingGap ?? 0) > 0 ? "text-red-700" : "text-green-700"
                    )}>
                      {formatCurrency(contract.financingGap ?? 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Payment Date</div>
                    <div className={cn(
                      "font-semibold text-sm mt-0.5",
                      paymentOverdue ? "text-red-700" : paymentSoon ? "text-orange-700" : "text-muted-foreground"
                    )}>
                      {formatDate(contract.expectedPaymentDate)}
                      {paymentOverdue && <div className="text-xs text-red-600">OVERDUE</div>}
                    </div>
                  </div>
                </div>

                {contract.supplierPaymentDate && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs">
                    <ArrowUpRight className="h-3 w-3 text-red-500" />
                    <span className="text-muted-foreground">Supplier payment due:</span>
                    <span className={cn("font-medium", isOverdue(contract.supplierPaymentDate) ? "text-red-600" : "")}>
                      {formatDate(contract.supplierPaymentDate)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <ArrowDownRight className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">Client payment expected:</span>
                    <span className="font-medium">{formatDate(contract.expectedPaymentDate)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Closed Contracts */}
      {closed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Completed Contracts</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground">Contract</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Revenue</th>
                  <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground">Profit</th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {closed.map((c: any) => (
                  <tr key={c.id}>
                    <td className="px-5 py-2.5">
                      <div className="text-sm font-medium">{c.title}</div>
                      <div className="text-xs text-muted-foreground">{c.client?.name}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(c.contractValue)}</td>
                    <td className="px-3 py-2.5 text-right text-green-700 font-medium">{formatCurrency(c.expectedProfit ?? 0)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <span className={cn("font-medium", (c.grossMargin ?? 0) > 20 ? "text-green-700" : "text-yellow-700")}>
                        {c.grossMargin != null ? `${c.grossMargin.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
