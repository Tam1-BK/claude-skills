"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  supplier?: any;
}

export function SupplierFormModal({ open, onClose, onSaved, supplier }: SupplierFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    category: supplier?.category ?? "",
    subcategory: supplier?.subcategory ?? "",
    contactPerson: supplier?.contactPerson ?? "",
    contactEmail: supplier?.contactEmail ?? "",
    contactPhone: supplier?.contactPhone ?? "",
    physicalAddress: supplier?.physicalAddress ?? "",
    county: supplier?.county ?? "",
    reliability: supplier?.reliability ?? "GOOD",
    deliveryCapacity: supplier?.deliveryCapacity ?? "",
    creditTerms: supplier?.creditTerms ?? "",
    paymentTerms: supplier?.paymentTerms ?? "",
    leadTimeDays: supplier?.leadTimeDays ?? "",
    minimumOrderValue: supplier?.minimumOrderValue ?? "",
    pastPerformance: supplier?.pastPerformance ?? "",
    notes: supplier?.notes ?? "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast({ title: supplier ? "Supplier updated" : "Supplier added" });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error saving supplier", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Supplier Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="Company name" />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Input value={form.category} onChange={(e) => set("category", e.target.value)} required placeholder="Medical Supplies / ICT / Civil Works" />
            </div>
            <div className="space-y-1.5">
              <Label>Reliability Rating</Label>
              <Select value={form.reliability} onValueChange={(v) => set("reliability", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["EXCELLENT", "GOOD", "AVERAGE", "POOR", "BLACKLISTED"].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person</Label>
              <Input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+254 7XX XXX XXX" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>County</Label>
              <Input value={form.county} onChange={(e) => set("county", e.target.value)} placeholder="Nairobi" />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Time (days)</Label>
              <Input type="number" value={form.leadTimeDays} onChange={(e) => set("leadTimeDays", e.target.value)} placeholder="14" />
            </div>
            <div className="space-y-1.5">
              <Label>Min Order Value (KES)</Label>
              <Input type="number" value={form.minimumOrderValue} onChange={(e) => set("minimumOrderValue", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Credit Terms</Label>
              <Input value={form.creditTerms} onChange={(e) => set("creditTerms", e.target.value)} placeholder="Net 30 days" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Payment Terms</Label>
              <Input value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} placeholder="50% deposit, 50% on delivery" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Delivery Capacity</Label>
              <Input value={form.deliveryCapacity} onChange={(e) => set("deliveryCapacity", e.target.value)} placeholder="Max units per delivery" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Past Performance Notes</Label>
              <Textarea value={form.pastPerformance} onChange={(e) => set("pastPerformance", e.target.value)} rows={2} />
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
              {supplier ? "Save Changes" : "Add Supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
