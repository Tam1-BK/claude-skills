"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ContractFormModal } from "@/components/contracts/contract-form-modal";

const CONTRACT_STATUSES = ["AWARDED", "SOURCING", "PO_ISSUED", "GOODS_IN_TRANSIT", "DELIVERED", "INVOICED", "PAID", "CLOSED", "DISPUTED"];

export function ContractsContent() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/contracts?${params}`);
    const data = await res.json();
    setContracts(data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchContracts, 300);
    return () => clearTimeout(t);
  }, [fetchContracts]);

  const totalValue = contracts.reduce((s, c) => s + c.contractValue, 0);
  const totalMargin = contracts.reduce((s, c) => s + (c.grossMargin ?? 0), 0) / (contracts.length || 1);
  const totalExposure = contracts.filter(c => !["PAID", "CLOSED"].includes(c.status)).reduce((s, c) => s + (c.workingCapital ?? 0), 0);

  return (
    <div className="p-6 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-xs text-muted-foreground">Total Contract Value</div>
          <div className="text-xl font-bold mt-1">{formatCurrency(totalValue)}</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-xs text-muted-foreground">Avg Gross Margin</div>
          <div className="text-xl font-bold mt-1 text-green-700">{totalMargin.toFixed(1)}%</div>
        </div>
        <div className="border rounded-lg p-4 bg-white">
          <div className="text-xs text-muted-foreground">Working Capital Deployed</div>
          <div className="text-xl font-bold mt-1 text-orange-700">{formatCurrency(totalExposure)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contracts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> New Contract
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Contract</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Client</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground">Value</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Margin</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Exposure</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Delivery</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Payment Due</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Risk</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                      No contracts found. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Add a contract.</button>
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => {
                    const deliveryOverdue = isOverdue(contract.deliveryDeadline) && !["DELIVERED", "INVOICED", "PAID", "CLOSED"].includes(contract.status);
                    return (
                      <tr key={contract.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/contracts/${contract.id}`} className="block">
                            <div className="font-medium hover:text-blue-600 flex items-center gap-1">
                              {contract.title}
                              <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                            {contract.contractNumber && (
                              <div className="text-xs text-muted-foreground">{contract.contractNumber}</div>
                            )}
                          </Link>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell text-sm text-muted-foreground">
                          {contract.client?.name}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {formatCurrency(contract.contractValue)}
                        </td>
                        <td className="px-3 py-3 text-right hidden lg:table-cell">
                          {contract.grossMargin != null ? (
                            <span className={cn(
                              "font-medium",
                              contract.grossMargin > 20 ? "text-green-700" : contract.grossMargin > 10 ? "text-yellow-700" : "text-red-700"
                            )}>
                              {contract.grossMargin.toFixed(1)}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-right hidden lg:table-cell text-orange-700 font-medium">
                          {contract.workingCapital ? formatCurrency(contract.workingCapital) : "—"}
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className={cn("text-xs", deliveryOverdue ? "text-red-600 font-medium" : "text-muted-foreground")}>
                            {deliveryOverdue ? "⚠ " : ""}{formatDate(contract.deliveryDeadline)}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden xl:table-cell">
                          <span className={cn(
                            "text-xs",
                            isOverdue(contract.expectedPaymentDate) && contract.status !== "PAID" ? "text-red-600 font-medium" :
                            isDueSoon(contract.expectedPaymentDate, 14) ? "text-orange-600" : "text-muted-foreground"
                          )}>
                            {formatDate(contract.expectedPaymentDate)}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(contract.riskLevel))}>
                            {contract.riskLevel}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(contract.status))}>
                            {formatLabel(contract.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ContractFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={fetchContracts} />
    </div>
  );
}
