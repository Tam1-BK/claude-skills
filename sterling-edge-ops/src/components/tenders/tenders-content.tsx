"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar, AlertTriangle, Target, TrendingDown } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isDueSoon, isOverdue, getBidScoreBg } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TenderFormModal } from "@/components/tenders/tender-form-modal";

const STAGES = [
  "IDENTIFIED", "UNDER_REVIEW", "DOCUMENTS_GATHERING", "PRICING",
  "TECHNICAL_RESPONSE", "LEGAL_REVIEW", "SUBMITTED", "AWAITING_AWARD",
  "WON", "LOST", "DECLINED",
];

export function TendersContent() {
  const [tenders, setTenders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const fetchTenders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stageFilter !== "all") params.set("stage", stageFilter);
    if (decisionFilter !== "all") params.set("decision", decisionFilter);
    if (eligibilityFilter !== "all") params.set("eligibility", eligibilityFilter);
    const res = await fetch(`/api/tenders?${params}`);
    const data = await res.json();
    setTenders(data);
    setLoading(false);
  }, [search, stageFilter, decisionFilter, eligibilityFilter]);

  useEffect(() => {
    const t = setTimeout(fetchTenders, 300);
    return () => clearTimeout(t);
  }, [fetchTenders]);

  const totalValue = tenders.filter(t => t.bidDecision === "PURSUE").reduce((s, t) => s + (t.estimatedValue ?? 0), 0);
  const pursuing = tenders.filter(t => t.bidDecision === "PURSUE").length;
  const overdueTenders = tenders.filter(t => isOverdue(t.deadline) && !["WON", "LOST", "DECLINED", "SUBMITTED", "AWAITING_AWARD"].includes(t.stage));

  return (
    <div className="p-6 space-y-5">
      {/* Alerts */}
      {overdueTenders.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{overdueTenders.length} tender deadline(s) have passed without submission. Review immediately.</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tenders..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {STAGES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Decision" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All decisions</SelectItem>
            {["PURSUE", "DECLINE", "MONITOR", "PENDING"].map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={eligibilityFilter} onValueChange={setEligibilityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Eligibility" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {["AGPO", "OPEN", "RESTRICTED", "INTERNATIONAL"].map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Tender
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-6 text-sm">
        <div><span className="font-semibold">{tenders.length}</span> <span className="text-muted-foreground">tenders</span></div>
        <div><span className="font-semibold text-green-700">{pursuing}</span> <span className="text-muted-foreground">pursuing</span></div>
        <div><span className="font-semibold">{formatCurrency(totalValue)}</span> <span className="text-muted-foreground">total value (pursuing)</span></div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Tender</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Eligibility</th>
                  <th className="text-right px-3 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Value</th>
                  <th className="text-center px-3 py-3 text-xs font-medium text-muted-foreground">Bid Score</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground">Deadline</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Stage</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tenders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                      No tenders found. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Add a tender.</button>
                    </td>
                  </tr>
                ) : (
                  tenders.map((tender) => {
                    const overdue = isOverdue(tender.deadline);
                    const soon = isDueSoon(tender.deadline, 7);
                    const score = tender.bidScore;
                    return (
                      <tr key={tender.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/tenders/${tender.id}`} className="block">
                            <div className="font-medium hover:text-blue-600 transition-colors">{tender.tenderName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {tender.procuringEntity}
                              {tender.tenderNumber && ` · ${tender.tenderNumber}`}
                            </div>
                          </Link>
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                            tender.eligibility === "AGPO" ? "bg-emerald-100 text-emerald-800" :
                            tender.eligibility === "OPEN" ? "bg-blue-100 text-blue-800" :
                            "bg-orange-100 text-orange-800"
                          )}>
                            {tender.eligibility}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right hidden lg:table-cell font-medium">
                          {tender.estimatedValue ? formatCurrency(tender.estimatedValue) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {score != null ? (
                            <span className={cn("inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold", getBidScoreBg(score))}>
                              {score >= 75 ? <Target className="h-3 w-3" /> : score < 55 ? <TrendingDown className="h-3 w-3" /> : null}
                              {score}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <div className={cn(
                            "text-xs font-medium",
                            overdue ? "text-red-600" : soon ? "text-orange-600" : "text-muted-foreground"
                          )}>
                            {overdue ? "⚠ OVERDUE" : formatDate(tender.deadline)}
                          </div>
                          {soon && !overdue && (
                            <div className="text-xs text-orange-500">Due soon</div>
                          )}
                        </td>
                        <td className="px-3 py-3 hidden md:table-cell">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(tender.stage))}>
                            {formatLabel(tender.stage)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(tender.bidDecision))}>
                            {tender.bidDecision}
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

      <TenderFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={fetchTenders} />
    </div>
  );
}
