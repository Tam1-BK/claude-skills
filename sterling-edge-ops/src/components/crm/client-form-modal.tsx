"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  client?: any;
}

export function ClientFormModal({ open, onClose, onSaved, client }: ClientFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: client?.name ?? "",
    type: client?.type ?? "MINISTRY",
    contactPerson: client?.contactPerson ?? "",
    contactEmail: client?.contactEmail ?? "",
    contactPhone: client?.contactPhone ?? "",
    physicalAddress: client?.physicalAddress ?? "",
    county: client?.county ?? "",
    relationshipOwner: client?.relationshipOwner ?? "",
    opportunityValue: client?.opportunityValue ?? "",
    pipelineStage: client?.pipelineStage ?? "LEAD_IDENTIFIED",
    relationshipStatus: client?.relationshipStatus ?? "PROSPECT",
    priority: client?.priority ?? "MEDIUM",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = client ? `/api/crm/${client.id}` : "/api/crm";
      const method = client ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: client ? "Client updated" : "Client added" });
      onSaved();
      onClose();
    } catch {
      toast({ title: "Error saving client", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Client / Entity Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required placeholder="e.g. Ministry of Health" />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["MINISTRY", "AGENCY", "COUNTY_GOVERNMENT", "PRIVATE_COMPANY", "NGO", "INTERNATIONAL_ORG", "INDIVIDUAL"].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person</Label>
              <Input value={form.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+254 7XX XXX XXX" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Contact Email</Label>
              <Input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} type="email" placeholder="procurement@entity.go.ke" />
            </div>
            <div className="space-y-1.5">
              <Label>County</Label>
              <Input value={form.county} onChange={(e) => set("county", e.target.value)} placeholder="Nairobi" />
            </div>
            <div className="space-y-1.5">
              <Label>Opportunity Value (KES)</Label>
              <Input value={form.opportunityValue} onChange={(e) => set("opportunityValue", e.target.value)} type="number" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Pipeline Stage</Label>
              <Select value={form.pipelineStage} onValueChange={(v) => set("pipelineStage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LEAD_IDENTIFIED", "CONTACT_MADE", "REQUIREMENTS_RECEIVED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST", "DORMANT"].map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Relationship Status</Label>
              <Select value={form.relationshipStatus} onValueChange={(v) => set("relationshipStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["ACTIVE", "DORMANT", "PROSPECT", "BLACKLISTED"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Relationship Owner</Label>
              <Input value={form.relationshipOwner} onChange={(e) => set("relationshipOwner", e.target.value)} placeholder="Your name" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Physical Address</Label>
              <Input value={form.physicalAddress} onChange={(e) => set("physicalAddress", e.target.value)} placeholder="Building, Street, Nairobi" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {client ? "Save Changes" : "Add Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
