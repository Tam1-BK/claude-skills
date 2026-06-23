"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Star, Phone, Mail, Package, Clock } from "lucide-react";
import { formatCurrency, getStatusColor, formatLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SupplierFormModal } from "@/components/suppliers/supplier-form-modal";

const RELIABILITY_COLORS: Record<string, string> = {
  EXCELLENT: "bg-green-100 text-green-800",
  GOOD: "bg-teal-100 text-teal-800",
  AVERAGE: "bg-yellow-100 text-yellow-800",
  POOR: "bg-orange-100 text-orange-800",
  BLACKLISTED: "bg-red-100 text-red-800",
};

export function SuppliersContent() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [reliabilityFilter, setReliabilityFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (reliabilityFilter !== "all") params.set("reliability", reliabilityFilter);
    const res = await fetch(`/api/suppliers?${params}`);
    const data = await res.json();
    setSuppliers(data);
    setLoading(false);
  }, [search, reliabilityFilter]);

  useEffect(() => {
    const t = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(t);
  }, [fetchSuppliers]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search suppliers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={reliabilityFilter} onValueChange={setReliabilityFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All ratings" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {["EXCELLENT", "GOOD", "AVERAGE", "POOR", "BLACKLISTED"].map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {suppliers.length} suppliers
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-lg bg-gray-100 animate-pulse" />)}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No suppliers found. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Add your first supplier.</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="border rounded-lg bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{supplier.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{supplier.category}</div>
                  {supplier.subcategory && <div className="text-xs text-muted-foreground">{supplier.subcategory}</div>}
                </div>
                <span className={cn("shrink-0 ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", RELIABILITY_COLORS[supplier.reliability])}>
                  {supplier.reliability}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {supplier.contactPerson && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {supplier.contactPhone}
                  </div>
                )}
                {supplier.contactEmail && (
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 shrink-0" /> {supplier.contactEmail}
                  </div>
                )}
                {supplier.leadTimeDays && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {supplier.leadTimeDays} days lead time
                  </div>
                )}
                {supplier.minimumOrderValue && (
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3 w-3" /> Min order: {formatCurrency(supplier.minimumOrderValue)}
                  </div>
                )}
              </div>

              {supplier.creditTerms && (
                <div className="mt-3 pt-3 border-t text-xs">
                  <span className="text-muted-foreground">Credit: </span>
                  <span>{supplier.creditTerms}</span>
                </div>
              )}

              {supplier.priceHistory?.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Recent prices</div>
                  {supplier.priceHistory.slice(0, 2).map((ph: any) => (
                    <div key={ph.id} className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate">{ph.item}</span>
                      <span className="font-medium ml-2 shrink-0">{formatCurrency(ph.price)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{supplier._count.contracts} contracts</span>
                {supplier.county && <span className="text-muted-foreground">{supplier.county}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <SupplierFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={fetchSuppliers} />
    </div>
  );
}
