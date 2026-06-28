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
import { formatLabel } from "@/lib/utils";

const DOC_TYPES = [
  "COMPANY_REGISTRATION", "AGPO_CERTIFICATE", "KRA_PIN", "TAX_COMPLIANCE", "CR12",
  "NCA_LICENSE", "NEMA_LICENSE", "SECTOR_LICENSE", "BID_DOCUMENT", "SUPPLIER_QUOTE",
  "LPO", "INVOICE", "DELIVERY_NOTE", "CONTRACT", "BANK_GUARANTEE", "BID_BOND",
  "PERFORMANCE_BOND", "INSURANCE", "OTHER",
];

interface DocumentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DocumentFormModal({ open, onClose, onSaved }: DocumentFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    type: "OTHER",
    fileName: "",
    expiryDate: "",
    isVerified: false,
    notes: "",
    clientId: "",
    supplierId: "",
    contractId: "",
    tenderId: "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/crm").then(r => r.json()).then(d => setClients(d.data ?? []));
      fetch("/api/suppliers").then(r => r.json()).then(d => setSuppliers(d.data ?? []));
    }
  }, [open]);

  function set(field: string, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Document added to vault" });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error adding document", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Document to Vault</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Document Name *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Tax Compliance Certificate 2025" />
          </div>
          <div className="space-y-1.5">
            <Label>Document Type *</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>File Name</Label>
            <Input value={form.fileName} onChange={(e) => set("fileName", e.target.value)} placeholder="document.pdf" />
          </div>
          <div className="space-y-1.5">
            <Label>Expiry Date (if applicable)</Label>
            <Input type="date" value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Link to Client</Label>
            <Select value={form.clientId} onValueChange={(v) => set("clientId", v)}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No link</SelectItem>
                {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Link to Supplier</Label>
            <Select value={form.supplierId} onValueChange={(v) => set("supplierId", v)}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No link</SelectItem>
                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="verified"
              checked={form.isVerified}
              onChange={(e) => set("isVerified", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="verified">Mark as verified</Label>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="e.g. KRA PIN: P051234567K" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add to Vault
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
