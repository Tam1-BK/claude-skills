"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Building2, Phone, Mail, Calendar, Users, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isDueSoon, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ClientFormModal } from "@/components/crm/client-form-modal";
import { AccessDenied } from "@/components/ui/access-denied";

const PIPELINE_STAGES = [
  "LEAD_IDENTIFIED", "CONTACT_MADE", "REQUIREMENTS_RECEIVED",
  "QUOTE_SENT", "NEGOTIATION", "WON", "LOST", "DORMANT",
];

const CLIENT_TYPES = ["MINISTRY", "AGENCY", "COUNTY_GOVERNMENT", "PRIVATE_COMPANY", "NGO", "INTERNATIONAL_ORG", "INDIVIDUAL"];

export function CRMContent() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"table" | "pipeline">("table");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter !== "all") params.set("stage", stageFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    const res = await fetch(`/api/crm?${params}`);
    if (res.status === 401 || res.status === 403) { setForbidden(true); setLoading(false); return; }
    const json = await res.json();
    setClients(json.data ?? []);
    setLoading(false);
  }, [search, stageFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchClients, 300);
    return () => clearTimeout(t);
  }, [fetchClients]);

  if (forbidden) return <AccessDenied />;

  const totalValue = clients.reduce((s, c) => s + (c.opportunityValue ?? 0), 0);

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, contacts, county..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {CLIENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-6 text-sm">
        <div><span className="font-semibold text-foreground">{clients.length}</span> <span className="text-muted-foreground">clients</span></div>
        <div><span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span> <span className="text-muted-foreground">total opportunity value</span></div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Client / Entity</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Pipeline Stage</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground">Opportunity</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Follow-up</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Owner</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      No clients found. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Add your first client.</button>
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const followUpSoon = isDueSoon(client.nextFollowUp, 3);
                    const followUpOverdue = isOverdue(client.nextFollowUp);
                    return (
                      <tr key={client.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/crm/${client.id}`} className="block">
                            <div className="font-medium hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {client.name}
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                            {client.contactPerson && (
                              <div className="text-xs text-muted-foreground mt-0.5">{client.contactPerson}</div>
                            )}
                          </Link>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(client.type))}>
                            {formatLabel(client.type)}
                          </span>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(client.pipelineStage))}>
                            {formatLabel(client.pipelineStage)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium">
                          {client.opportunityValue ? formatCurrency(client.opportunityValue) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          {client.nextFollowUp ? (
                            <span className={cn(
                              "text-xs",
                              followUpOverdue ? "text-red-600 font-medium" :
                              followUpSoon ? "text-orange-600 font-medium" : "text-muted-foreground"
                            )}>
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {formatDate(client.nextFollowUp)}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-3 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                          {client.owner?.name ?? client.relationshipOwner}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(client.relationshipStatus))}>
                            {formatLabel(client.relationshipStatus)}
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

      <ClientFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={fetchClients} />
    </div>
  );
}
