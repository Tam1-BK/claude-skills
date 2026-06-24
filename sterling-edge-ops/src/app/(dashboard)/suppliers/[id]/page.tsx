"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Package, Clock, Star, FileText, ClipboardList, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isOverdue } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";

const RELIABILITY_COLORS: Record<string, string> = {
  EXCELLENT: "bg-green-100 text-green-800",
  GOOD: "bg-teal-100 text-teal-800",
  AVERAGE: "bg-yellow-100 text-yellow-800",
  POOR: "bg-orange-100 text-orange-800",
  BLACKLISTED: "bg-red-100 text-red-800",
};

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/suppliers/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setSupplier(data);
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

  if (notFound) return (
    <div className="p-6 text-center py-24 text-muted-foreground">
      <div className="text-lg font-medium mb-2">Supplier not found</div>
      <Button variant="outline" onClick={() => router.push("/suppliers")}>Back to Suppliers</Button>
    </div>
  );

  if (!supplier) return null;

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/suppliers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold">{supplier.name}</h1>
            <p className="text-xs text-muted-foreground">{supplier.category}{supplier.subcategory ? ` · ${supplier.subcategory}` : ""}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
          <Edit className="h-3.5 w-3.5" /> Edit
        </Button>
      </header>

      <div className="p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Reliability</div>
            <div className="mt-2">
              <span className={cn("inline-flex items-center rounded px-2 py-1 text-sm font-medium", RELIABILITY_COLORS[supplier.reliability])}>
                <Star className="h-3.5 w-3.5 mr-1" />
                {supplier.reliability}
              </span>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Lead Time</div>
            <div className="text-xl font-bold mt-1">{supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : "—"}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Min Order</div>
            <div className="text-xl font-bold mt-1">{supplier.minimumOrderValue ? formatCurrency(supplier.minimumOrderValue) : "—"}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Contracts</div>
            <div className="text-xl font-bold mt-1">{supplier.contracts?.length ?? 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact & Details */}
          <div className="border rounded-lg p-5 bg-white space-y-3">
            <div className="font-medium text-sm">Supplier Details</div>
            <div className="space-y-2 text-sm">
              {supplier.contactPerson && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-medium">{supplier.contactPerson}</span>
                </div>
              )}
              {supplier.contactPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {supplier.contactPhone}
                  </span>
                </div>
              )}
              {supplier.contactEmail && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="flex items-center gap-1 truncate max-w-48">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {supplier.contactEmail}
                  </span>
                </div>
              )}
              {supplier.county && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">County</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {supplier.county}
                  </span>
                </div>
              )}
              {supplier.creditTerms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credit Terms</span>
                  <span>{supplier.creditTerms}</span>
                </div>
              )}
              {supplier.paymentTerms && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Terms</span>
                  <span className="text-right max-w-48">{supplier.paymentTerms}</span>
                </div>
              )}
              {supplier.deliveryCapacity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Capacity</span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" /> {supplier.deliveryCapacity}
                  </span>
                </div>
              )}
              {supplier.registrationNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reg. Number</span>
                  <span className="font-mono text-xs">{supplier.registrationNumber}</span>
                </div>
              )}
              {supplier.kraPin && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KRA PIN</span>
                  <span className="font-mono text-xs">{supplier.kraPin}</span>
                </div>
              )}
            </div>
            {supplier.pastPerformance && (
              <div className="pt-3 border-t text-xs text-muted-foreground whitespace-pre-wrap">
                <div className="font-medium text-foreground mb-1">Past Performance</div>
                {supplier.pastPerformance}
              </div>
            )}
            {supplier.notes && (
              <div className="pt-3 border-t text-xs text-muted-foreground whitespace-pre-wrap">{supplier.notes}</div>
            )}
          </div>

          {/* Price History */}
          <div className="border rounded-lg p-5 bg-white space-y-3">
            <div className="font-medium text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Price History
            </div>
            {supplier.priceHistory?.length > 0 ? (
              <div className="space-y-2">
                {supplier.priceHistory.map((ph: any) => (
                  <div key={ph.id} className="flex items-start justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <div className="font-medium">{ph.item}</div>
                      {ph.unit && <div className="text-xs text-muted-foreground">per {ph.unit}</div>}
                      {ph.notes && <div className="text-xs text-muted-foreground">{ph.notes}</div>}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="font-semibold">{formatCurrency(ph.price)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(ph.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">No price history recorded</div>
            )}
          </div>
        </div>

        {/* Contracts */}
        {supplier.contracts?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Contracts ({supplier.contracts.length})</span>
            </div>
            <div className="divide-y">
              {supplier.contracts.map((c: any) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/contracts/${c.id}`} className="font-medium hover:text-blue-600 transition-colors">
                      {c.title}
                    </Link>
                    {c.client && <span className="text-xs text-muted-foreground ml-2">· {c.client.name}</span>}
                  </div>
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

        {/* Documents */}
        {supplier.documents?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Documents ({supplier.documents.length})</span>
            </div>
            <div className="divide-y">
              {supplier.documents.map((d: any) => (
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
      </div>

      <SupplierFormModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={load} supplier={supplier} />
    </div>
  );
}
