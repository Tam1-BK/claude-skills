"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

interface ContractFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  contract?: any;
}

export function ContractFormModal({ open, onClose, onSaved, contract }: ContractFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: contract?.title ?? "",
    contractNumber: contract?.contractNumber ?? "",
    clientId: contract?.clientId ?? "",
    supplierId: contract?.supplierId ?? "",
    contractValue: contract?.contractValue ?? "",
    costOfGoods: contract?.costOfGoods ?? "",
    logisticsCost: contract?.logisticsCost ?? "",
    otherCosts: contract?.otherCosts ?? "",
    deliveryDeadline: contract?.deliveryDeadline ? new Date(contract.deliveryDeadline).toISOString().split("T")[0] : "",
    paymentTerms: contract?.paymentTerms ?? "",
    expectedPaymentDate: contract?.expectedPaymentDate ? new Date(contract.expectedPaymentDate).toISOString().split("T")[0] : "",
    supplierPaymentDate: contract?.supplierPaymentDate ? new Date(contract.supplierPaymentDate).toISOString().split("T")[0] : "",
    financingRequired: contract?.financingRequired ?? false,
    financingAmount: contract?.financingAmount ?? "",
    status: contract?.status ?? "AWARDED",
    riskLevel: contract?.riskLevel ?? "MEDIUM",
    notes: contract?.notes ?? "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/crm").then(r => r.json()).then(setClients);
      fetch("/api/suppliers").then(r => r.json()).then(setSuppliers);
    }
  }, [open]);

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const contractValue = parseFloat(form.contractValue as string) || 0;
  const costOfGoods = parseFloat(form.costOfGoods as string) || 0;
  const logisticsCost = parseFloat(form.logisticsCost as string) || 0;
  const otherCosts = parseFloat(form.otherCosts as string) || 0;
  const totalCost = costOfGoods + logisticsCost + otherCosts;
  const grossMargin = contractValue > 0 ? ((contractValue - totalCost) / contractValue * 100) : 0;
  const expectedProfit = contractValue - totalCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = contract ? `/api/contracts/${contract.id}` : "/api/contracts";
      const method = contract ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: contract ? "Contract updated" : "Contract created" });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error saving contract", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contract ? "Edit Contract" : "New Contract / Order"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Contract Title *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Supply of..." />
            </div>
            <div className="space-y-1.5">
              <Label>Contract / LPO Number</Label>
              <Input value={form.contractNumber} onChange={(e) => set("contractNumber", e.target.value)} placeholder="MOH/CONT/2024/045" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["AWARDED", "SOURCING", "PO_ISSUED", "GOODS_IN_TRANSIT", "DELIVERED", "INVOICED", "PAID", "CLOSED", "DISPUTED"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={form.clientId} onValueChange={(v) => set("clientId", v)}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier</Label>
              <Select value={form.supplierId} onValueChange={(v) => set("supplierId", v)}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No supplier yet</SelectItem>
                  {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Financials */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="font-medium text-sm">Financial Details</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contract Value (KES) *</Label>
                <Input type="number" value={form.contractValue} onChange={(e) => set("contractValue", e.target.value)} required placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Cost of Goods (KES)</Label>
                <Input type="number" value={form.costOfGoods} onChange={(e) => set("costOfGoods", e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Logistics Cost (KES)</Label>
                <Input type="number" value={form.logisticsCost} onChange={(e) => set("logisticsCost", e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Other Costs (KES)</Label>
                <Input type="number" value={form.otherCosts} onChange={(e) => set("otherCosts", e.target.value)} placeholder="0" />
              </div>
            </div>
            {contractValue > 0 && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded">
                <div>
                  <div className="text-xs text-muted-foreground">Total Cost</div>
                  <div className="font-semibold text-sm">{formatCurrency(totalCost)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Gross Margin</div>
                  <div className={`font-semibold text-sm ${grossMargin > 20 ? "text-green-700" : grossMargin > 10 ? "text-yellow-700" : "text-red-700"}`}>
                    {grossMargin.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Expected Profit</div>
                  <div className="font-semibold text-sm">{formatCurrency(expectedProfit)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Delivery Deadline</Label>
              <Input type="date" value={form.deliveryDeadline} onChange={(e) => set("deliveryDeadline", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Terms</Label>
              <Input value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} placeholder="Net 30 days from delivery" />
            </div>
            <div className="space-y-1.5">
              <Label>Expected Client Payment</Label>
              <Input type="date" value={form.expectedPaymentDate} onChange={(e) => set("expectedPaymentDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier Payment Date</Label>
              <Input type="date" value={form.supplierPaymentDate} onChange={(e) => set("supplierPaymentDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Financing Amount (KES)</Label>
              <Input type="number" value={form.financingAmount} onChange={(e) => set("financingAmount", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Risk Level</Label>
              <Select value={form.riskLevel} onValueChange={(v) => set("riskLevel", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {contract ? "Save Changes" : "Create Contract"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
