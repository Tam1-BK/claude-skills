"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Package, FileText, CheckSquare, Edit, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ContractFormModal } from "@/components/contracts/contract-form-modal";
import { AccessDenied } from "@/components/ui/access-denied";

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/contracts/${id}`);
    if (res.status === 401 || res.status === 403) { setForbidden(true); setLoading(false); return; }
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setContract(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
      <div className="h-40 rounded bg-gray-100 animate-pulse" />
      <div className="h-64 rounded bg-gray-100 animate-pulse" />
    </div>
  );

  if (forbidden) return <AccessDenied />;

  if (notFound) return (
    <div className="p-6 text-center py-24 text-muted-foreground">
      <div className="text-lg font-medium mb-2">Contract not found</div>
      <Button variant="outline" onClick={() => router.push("/contracts")}>Back to Contracts</Button>
    </div>
  );

  if (!contract) return null;

  const deliveryOverdue = isOverdue(contract.deliveryDeadline) && !["DELIVERED", "INVOICED", "PAID", "CLOSED"].includes(contract.status);
  const paymentOverdue = isOverdue(contract.expectedPaymentDate) && contract.status !== "PAID";
  const paymentSoon = isDueSoon(contract.expectedPaymentDate, 14);

  const totalCost = (contract.costOfGoods ?? 0) + (contract.logisticsCost ?? 0) + (contract.otherCosts ?? 0);

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/contracts")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold line-clamp-1">{contract.title}</h1>
            <p className="text-xs text-muted-foreground">{contract.contractNumber || "No reference number"}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
          <Edit className="h-3.5 w-3.5" /> Edit
        </Button>
      </header>

      <div className="p-6 space-y-6">
        {/* Alerts */}
        {(deliveryOverdue || paymentOverdue) && (
          <div className="space-y-2">
            {deliveryOverdue && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Delivery deadline has passed. Update status or escalate.
              </div>
            )}
            {paymentOverdue && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Client payment is overdue. Follow up immediately.
              </div>
            )}
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Contract Value</div>
            <div className="text-xl font-bold mt-1">{formatCurrency(contract.contractValue)}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Gross Margin</div>
            <div className={cn("text-xl font-bold mt-1",
              contract.grossMargin > 20 ? "text-green-700" : contract.grossMargin > 10 ? "text-yellow-700" : "text-red-700"
            )}>
              {contract.grossMargin != null ? `${contract.grossMargin.toFixed(1)}%` : "—"}
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Working Capital</div>
            <div className="text-xl font-bold mt-1 text-orange-700">
              {contract.workingCapital ? formatCurrency(contract.workingCapital) : "—"}
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-1">
              <span className={cn("rounded px-2 py-1 text-sm font-medium", getStatusColor(contract.status))}>
                {formatLabel(contract.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Key details */}
          <div className="border rounded-lg p-5 bg-white space-y-3">
            <div className="font-medium text-sm">Contract Details</div>
            <div className="space-y-2 text-sm">
              {contract.client && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <Link href={`/crm/${contract.client.id}`} className="text-blue-600 hover:underline text-sm">
                    {contract.client.name}
                  </Link>
                </div>
              )}
              {contract.supplier && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier</span>
                  <span>{contract.supplier.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Level</span>
                <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(contract.riskLevel))}>
                  {contract.riskLevel}
                </span>
              </div>
              {contract.paymentTerms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Terms</span>
                  <span className="text-right max-w-48">{contract.paymentTerms}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Deadline</span>
                <span className={cn("text-sm", deliveryOverdue ? "text-red-600 font-medium" : "")}>
                  {deliveryOverdue ? "⚠ " : ""}{formatDate(contract.deliveryDeadline)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Payment</span>
                <span className={cn("text-sm", paymentOverdue ? "text-red-600 font-medium" : paymentSoon ? "text-orange-600" : "")}>
                  {formatDate(contract.expectedPaymentDate)}
                </span>
              </div>
              {contract.supplierPaymentDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Supplier Payment</span>
                  <span>{formatDate(contract.supplierPaymentDate)}</span>
                </div>
              )}
              {contract.financingRequired && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Financing</span>
                  <span>{contract.financingAmount ? formatCurrency(contract.financingAmount) : "Required"}</span>
                </div>
              )}
            </div>
            {contract.notes && (
              <div className="pt-3 border-t text-xs text-muted-foreground whitespace-pre-wrap">{contract.notes}</div>
            )}
          </div>

          {/* Financials breakdown */}
          <div className="border rounded-lg p-5 bg-white space-y-3">
            <div className="font-medium text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Financial Breakdown
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract Value</span>
                <span className="font-semibold">{formatCurrency(contract.contractValue)}</span>
              </div>
              {contract.costOfGoods > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost of Goods</span>
                  <span className="text-red-700">− {formatCurrency(contract.costOfGoods)}</span>
                </div>
              )}
              {contract.logisticsCost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Logistics Cost</span>
                  <span className="text-red-700">− {formatCurrency(contract.logisticsCost)}</span>
                </div>
              )}
              {contract.otherCosts > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Costs</span>
                  <span className="text-red-700">− {formatCurrency(contract.otherCosts)}</span>
                </div>
              )}
              {totalCost > 0 && (
                <div className="flex justify-between pt-2 border-t font-medium">
                  <span>Expected Profit</span>
                  <span className={cn(contract.contractValue - totalCost > 0 ? "text-green-700" : "text-red-700")}>
                    {formatCurrency(contract.contractValue - totalCost)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        {contract.documents?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Documents ({contract.documents.length})</span>
            </div>
            <div className="divide-y">
              {contract.documents.map((d: any) => (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{formatLabel(d.type)}</span>
                    {d.expiryDate && isOverdue(d.expiryDate) && (
                      <span className="text-red-600 font-medium">Expired</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Tasks */}
        {contract.tasks?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Open Tasks ({contract.tasks.length})</span>
            </div>
            <div className="divide-y">
              {contract.tasks.map((t: any) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className={cn(isOverdue(t.dueDate) ? "text-red-600 font-medium" : "")}>{t.title}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {t.assignee && <span>→ {t.assignee.name}</span>}
                    {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ContractFormModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={load} contract={contract} />
    </div>
  );
}
