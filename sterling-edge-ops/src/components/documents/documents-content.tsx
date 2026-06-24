"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { formatDate, formatLabel, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DocumentFormModal } from "@/components/documents/document-form-modal";

const DOC_TYPES = [
  "COMPANY_REGISTRATION", "AGPO_CERTIFICATE", "KRA_PIN", "TAX_COMPLIANCE", "CR12",
  "NCA_LICENSE", "NEMA_LICENSE", "SECTOR_LICENSE", "BID_DOCUMENT", "SUPPLIER_QUOTE",
  "LPO", "INVOICE", "DELIVERY_NOTE", "CONTRACT", "BANK_GUARANTEE", "BID_BOND",
  "PERFORMANCE_BOND", "INSURANCE", "OTHER",
];

const TYPE_ICONS: Record<string, string> = {
  COMPANY_REGISTRATION: "🏢",
  AGPO_CERTIFICATE: "🏆",
  KRA_PIN: "🔑",
  TAX_COMPLIANCE: "📋",
  CR12: "📄",
  NCA_LICENSE: "🏗️",
  NEMA_LICENSE: "🌱",
  BID_DOCUMENT: "📑",
  SUPPLIER_QUOTE: "💰",
  LPO: "📝",
  INVOICE: "🧾",
  DELIVERY_NOTE: "🚚",
  CONTRACT: "📃",
  BID_BOND: "🔒",
  OTHER: "📁",
};

export function DocumentsContent() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter !== "all") params.set("type", typeFilter);
    const res = await fetch(`/api/documents?${params}`);
    const json = await res.json();
    setDocuments(json.data ?? []);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(t);
  }, [fetchDocuments]);

  // Expiry alerts
  const expiring = documents.filter(d => d.expiryDate && isDueSoon(d.expiryDate, 30) && !isOverdue(d.expiryDate));
  const expired = documents.filter(d => d.expiryDate && isOverdue(d.expiryDate));

  return (
    <div className="p-6 space-y-5">
      {/* Expiry Alerts */}
      {expired.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <div className="font-semibold text-red-800 text-sm">{expired.length} document(s) expired</div>
            <div className="text-sm text-red-700 mt-1">
              {expired.map(d => d.name).join(", ")} — Renew immediately to avoid disqualification.
            </div>
          </div>
        </div>
      )}
      {expiring.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Clock className="h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <div className="font-semibold text-yellow-800 text-sm">{expiring.length} document(s) expiring soon</div>
            <div className="text-sm text-yellow-700 mt-1">
              {expiring.map(d => `${d.name} (expires ${formatDate(d.expiryDate)})`).join(", ")}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">{documents.length} documents</div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded bg-gray-100 animate-pulse" />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No documents found. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Add a document.</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const docExpired = doc.expiryDate && isOverdue(doc.expiryDate);
            const docExpiringSoon = doc.expiryDate && isDueSoon(doc.expiryDate, 30);

            return (
              <div key={doc.id} className={cn(
                "border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow",
                docExpired && "border-red-200",
                docExpiringSoon && !docExpired && "border-yellow-200"
              )}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{TYPE_ICONS[doc.type] ?? "📁"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm truncate">{doc.name}</div>
                      {doc.isVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatLabel(doc.type)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {doc.client && <div>Client: <span className="text-foreground">{doc.client.name}</span></div>}
                  {doc.tender && <div>Tender: <span className="text-foreground">{doc.tender.tenderName?.substring(0, 40)}...</span></div>}
                  {doc.supplier && <div>Supplier: <span className="text-foreground">{doc.supplier.name}</span></div>}
                  {doc.contract && <div>Contract: <span className="text-foreground">{doc.contract.title?.substring(0, 40)}</span></div>}
                </div>

                {doc.expiryDate && (
                  <div className={cn(
                    "mt-3 pt-3 border-t text-xs font-medium flex items-center gap-1",
                    docExpired ? "text-red-600" : docExpiringSoon ? "text-yellow-700" : "text-muted-foreground"
                  )}>
                    {docExpired ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {docExpired ? "Expired: " : "Expires: "}{formatDate(doc.expiryDate)}
                  </div>
                )}

                {doc.notes && (
                  <div className="mt-2 text-xs text-muted-foreground">{doc.notes}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DocumentFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={fetchDocuments} />
    </div>
  );
}
