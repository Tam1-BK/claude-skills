"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Info } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { calcBidScore, getBidScoreBg } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TenderFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  tender?: any;
}

const SCORE_FIELDS = [
  { key: "eligibilityScore", label: "Eligibility", hint: "AGPO = 90, Open but qualified = 70, Restricted/unclear = 30" },
  { key: "capitalScore", label: "Capital Available", hint: "Can fund without stress = 90, Need financing = 60, Critical gap = 20" },
  { key: "deadlineScore", label: "Deadline Pressure", hint: "3+ weeks = 90, 2 weeks = 60, <1 week = 20" },
  { key: "documentScore", label: "Document Readiness", hint: "All docs ready = 90, 1-2 missing = 60, Many missing = 20" },
  { key: "supplierScore", label: "Supplier Availability", hint: "Confirmed supplier = 90, Good option = 70, Unconfirmed = 30" },
  { key: "marginScore", label: "Margin Potential", hint: ">25% margin = 90, 15-25% = 70, <10% = 30" },
  { key: "relationshipScore", label: "Relationship Strength", hint: "Strong contact = 90, Known = 60, Cold = 20" },
  { key: "licenseScore", label: "License Compliance", hint: "All licenses = 90, Can get = 60, Missing critical = 20" },
  { key: "paymentRiskScore", label: "Payment Risk", hint: "Good payer = 90, Average = 60, High risk = 20" },
];

export function TenderFormModal({ open, onClose, onSaved, tender }: TenderFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    tenderName: tender?.tenderName ?? "",
    tenderNumber: tender?.tenderNumber ?? "",
    procuringEntity: tender?.procuringEntity ?? "",
    category: tender?.category ?? "",
    eligibility: tender?.eligibility ?? "OPEN",
    deadline: tender?.deadline ? new Date(tender.deadline).toISOString().split("T")[0] : "",
    bidBondRequired: tender?.bidBondRequired ?? false,
    bidBondAmount: tender?.bidBondAmount ?? "",
    estimatedValue: tender?.estimatedValue ?? "",
    stage: tender?.stage ?? "IDENTIFIED",
    bidDecision: tender?.bidDecision ?? "PENDING",
    technicalRequirements: tender?.technicalRequirements ?? "",
    financialRequirements: tender?.financialRequirements ?? "",
    notes: tender?.notes ?? "",
    priority: tender?.priority ?? "MEDIUM",
    eligibilityScore: tender?.eligibilityScore ?? "",
    capitalScore: tender?.capitalScore ?? "",
    deadlineScore: tender?.deadlineScore ?? "",
    documentScore: tender?.documentScore ?? "",
    supplierScore: tender?.supplierScore ?? "",
    marginScore: tender?.marginScore ?? "",
    relationshipScore: tender?.relationshipScore ?? "",
    licenseScore: tender?.licenseScore ?? "",
    paymentRiskScore: tender?.paymentRiskScore ?? "",
  });

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const computedScore = calcBidScore({
    eligibilityScore: form.eligibilityScore ? Number(form.eligibilityScore) : null,
    capitalScore: form.capitalScore ? Number(form.capitalScore) : null,
    deadlineScore: form.deadlineScore ? Number(form.deadlineScore) : null,
    documentScore: form.documentScore ? Number(form.documentScore) : null,
    supplierScore: form.supplierScore ? Number(form.supplierScore) : null,
    marginScore: form.marginScore ? Number(form.marginScore) : null,
    relationshipScore: form.relationshipScore ? Number(form.relationshipScore) : null,
    licenseScore: form.licenseScore ? Number(form.licenseScore) : null,
    paymentRiskScore: form.paymentRiskScore ? Number(form.paymentRiskScore) : null,
  });

  const suggestedDecision = computedScore >= 70 ? "PURSUE" : computedScore >= 50 ? "MONITOR" : "DECLINE";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = tender ? `/api/tenders/${tender.id}` : "/api/tenders";
      const method = tender ? "PATCH" : "POST";
      const payload = { ...form, bidScore: computedScore };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: tender ? "Tender updated" : "Tender added" });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error saving tender", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tender ? "Edit Tender" : "Add New Tender"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Tender Name *</Label>
              <Input value={form.tenderName} onChange={(e) => set("tenderName", e.target.value)} required placeholder="Supply of..." />
            </div>
            <div className="space-y-1.5">
              <Label>Tender Number</Label>
              <Input value={form.tenderNumber} onChange={(e) => set("tenderNumber", e.target.value)} placeholder="MOH/PROC/2024/089" />
            </div>
            <div className="space-y-1.5">
              <Label>Procuring Entity *</Label>
              <Input value={form.procuringEntity} onChange={(e) => set("procuringEntity", e.target.value)} required placeholder="Ministry of Health" />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} required placeholder="Medical Supplies / ICT / Civil Works" />
            </div>
            <div className="space-y-1.5">
              <Label>Eligibility</Label>
              <Select value={form.eligibility} onValueChange={(v) => set("eligibility", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["AGPO", "OPEN", "RESTRICTED", "INTERNATIONAL"].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Submission Deadline *</Label>
              <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated Value (KES)</Label>
              <Input type="number" value={form.estimatedValue} onChange={(e) => set("estimatedValue", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={form.stage} onValueChange={(v) => set("stage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["IDENTIFIED", "UNDER_REVIEW", "DOCUMENTS_GATHERING", "PRICING", "TECHNICAL_RESPONSE", "LEGAL_REVIEW", "SUBMITTED", "AWAITING_AWARD", "WON", "LOST", "DECLINED"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Key context, risks, relationships..." />
            </div>
          </div>

          {/* Bid Scoring */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">Bid / No-Bid Scoring</div>
              {computedScore > 0 && (
                <div className="flex items-center gap-2">
                  <span className={cn("rounded px-2 py-0.5 text-sm font-bold", getBidScoreBg(computedScore))}>
                    Score: {computedScore}
                  </span>
                  <span className={cn("rounded px-2 py-0.5 text-xs font-medium",
                    suggestedDecision === "PURSUE" ? "bg-green-100 text-green-800" :
                    suggestedDecision === "MONITOR" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                  )}>
                    → {suggestedDecision}
                  </span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {SCORE_FIELDS.map(({ key, label, hint }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label} (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={(form as any)[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder="—"
                    className="h-8 text-xs"
                  />
                  <div className="text-xs text-muted-foreground">{hint}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label>Bid Decision</Label>
              <Select value={form.bidDecision} onValueChange={(v) => set("bidDecision", v)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PURSUE", "DECLINE", "MONITOR", "PENDING"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {tender ? "Save Changes" : "Add Tender"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
