"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, Phone, Mail, MapPin, Calendar, Edit, Trash2, Users, FileText, ClipboardList, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ClientFormModal } from "@/components/crm/client-form-modal";
import { AccessDenied } from "@/components/ui/access-denied";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/crm/${id}`);
    if (res.status === 401 || res.status === 403) { setForbidden(true); setLoading(false); return; }
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setClient(data);
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
      <div className="text-lg font-medium mb-2">Client not found</div>
      <Button variant="outline" onClick={() => router.push("/crm")}>Back to CRM</Button>
    </div>
  );

  if (!client) return null;

  const followUpOverdue = isOverdue(client.nextFollowUp);
  const followUpSoon = isDueSoon(client.nextFollowUp, 3);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/crm")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold">{client.name}</h1>
            <p className="text-xs text-muted-foreground">{formatLabel(client.type)}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
          <Edit className="h-3.5 w-3.5" /> Edit
        </Button>
      </header>

      <div className="p-6 space-y-6">
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border rounded-lg p-5 bg-white space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-medium", getStatusColor(client.pipelineStage))}>
                {formatLabel(client.pipelineStage)}
              </span>
              <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-medium", getStatusColor(client.relationshipStatus))}>
                {client.relationshipStatus}
              </span>
              {client.priority && (
                <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-medium", getStatusColor(client.priority))}>
                  {client.priority}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {client.contactPerson && (
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Contact Person</div>
                  <div className="font-medium">{client.contactPerson}</div>
                </div>
              )}
              {client.contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{client.contactPhone}</span>
                </div>
              )}
              {client.contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{client.contactEmail}</span>
                </div>
              )}
              {client.county && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{client.county}</span>
                </div>
              )}
              {client.physicalAddress && (
                <div className="col-span-2 text-xs text-muted-foreground">{client.physicalAddress}</div>
              )}
              {client.nextFollowUp && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={cn("text-sm", followUpOverdue ? "text-red-600 font-medium" : followUpSoon ? "text-orange-600 font-medium" : "")}>
                    Follow-up: {formatDate(client.nextFollowUp)}
                  </span>
                </div>
              )}
              {client.relationshipOwner && (
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Relationship Owner</div>
                  <div>{client.owner?.name ?? client.relationshipOwner}</div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="border rounded-lg p-4 bg-white text-center">
              <div className="text-xs text-muted-foreground">Opportunity Value</div>
              <div className="text-2xl font-bold mt-1">{client.opportunityValue ? formatCurrency(client.opportunityValue) : "—"}</div>
            </div>
            <div className="border rounded-lg p-4 bg-white text-center">
              <div className="text-xs text-muted-foreground">Tenders</div>
              <div className="text-2xl font-bold mt-1">{client.tenders?.length ?? 0}</div>
            </div>
            <div className="border rounded-lg p-4 bg-white text-center">
              <div className="text-xs text-muted-foreground">Contracts</div>
              <div className="text-2xl font-bold mt-1">{client.contracts?.length ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Contacts */}
        {client.contacts?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Contacts ({client.contacts.length})</span>
            </div>
            <div className="divide-y">
              {client.contacts.map((c: any) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.isPrimary && <span className="ml-2 text-xs text-blue-600 font-medium">Primary</span>}
                    {c.title && <span className="ml-2 text-muted-foreground">{c.title}</span>}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {c.phone && <span>{c.phone}</span>}
                    {c.email && <span>{c.email}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tenders */}
        {client.tenders?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tenders ({client.tenders.length})</span>
            </div>
            <div className="divide-y">
              {client.tenders.map((t: any) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <Link href={`/tenders/${t.id}`} className="font-medium hover:text-blue-600 transition-colors">
                    {t.tenderName}
                  </Link>
                  <div className="flex items-center gap-3">
                    {t.estimatedValue && <span className="text-muted-foreground">{formatCurrency(t.estimatedValue)}</span>}
                    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(t.stage))}>
                      {formatLabel(t.stage)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contracts */}
        {client.contracts?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Contracts ({client.contracts.length})</span>
            </div>
            <div className="divide-y">
              {client.contracts.map((c: any) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <Link href={`/contracts/${c.id}`} className="font-medium hover:text-blue-600 transition-colors">
                    {c.title}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{formatCurrency(c.contractValue)}</span>
                    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(c.status))}>
                      {formatLabel(c.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Tasks */}
        {client.tasks?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Open Tasks ({client.tasks.length})</span>
            </div>
            <div className="divide-y">
              {client.tasks.map((t: any) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className={cn(isOverdue(t.dueDate) ? "text-red-600 font-medium" : "")}>{t.title}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {t.dueDate && <span>{formatDate(t.dueDate)}</span>}
                    <span className={cn("rounded px-2 py-0.5 font-medium", getStatusColor(t.priority))}>{t.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ClientFormModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={load} client={client} />
    </div>
  );
}
