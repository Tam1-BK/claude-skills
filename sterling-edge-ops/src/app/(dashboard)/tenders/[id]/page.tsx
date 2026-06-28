"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Target, TrendingDown, FileText, CheckSquare, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getStatusColor, formatLabel, isOverdue, isDueSoon, getBidScoreBg, calcBidScore } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TenderFormModal } from "@/components/tenders/tender-form-modal";
import { AccessDenied } from "@/components/ui/access-denied";

const SCORE_FIELDS = [
  { key: "eligibilityScore", label: "Eligibility", weight: "20%" },
  { key: "capitalScore", label: "Capital Available", weight: "15%" },
  { key: "documentScore", label: "Document Readiness", weight: "15%" },
  { key: "deadlineScore", label: "Deadline Pressure", weight: "10%" },
  { key: "supplierScore", label: "Supplier Availability", weight: "10%" },
  { key: "marginScore", label: "Margin Potential", weight: "10%" },
  { key: "relationshipScore", label: "Relationship Strength", weight: "10%" },
  { key: "licenseScore", label: "License Compliance", weight: "5%" },
  { key: "paymentRiskScore", label: "Payment Risk", weight: "5%" },
];

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tender, setTender] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/tenders/${id}`);
    if (res.status === 401 || res.status === 403) { setForbidden(true); setLoading(false); return; }
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setTender(data);
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
      <div className="text-lg font-medium mb-2">Tender not found</div>
      <Button variant="outline" onClick={() => router.push("/tenders")}>Back to Tenders</Button>
    </div>
  );

  if (!tender) return null;

  const deadlineOverdue = isOverdue(tender.deadline) && !["WON", "LOST", "DECLINED", "SUBMITTED", "AWAITING_AWARD"].includes(tender.stage);
  const deadlineSoon = isDueSoon(tender.deadline, 7);
  const score = tender.bidScore ?? calcBidScore(tender);
  const decision = tender.bidDecision;

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/tenders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold line-clamp-1">{tender.tenderName}</h1>
            <p className="text-xs text-muted-foreground">{tender.procuringEntity}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
          <Edit className="h-3.5 w-3.5" /> Edit
        </Button>
      </header>

      <div className="p-6 space-y-6">
        {/* Alert banner */}
        {deadlineOverdue && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
            Deadline passed — this tender requires immediate review.
          </div>
        )}

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Bid Score</div>
            <div className="mt-1 flex items-center gap-2">
              {score != null ? (
                <span className={cn("rounded px-2 py-1 text-lg font-bold", getBidScoreBg(score))}>
                  {score >= 75 ? <Target className="inline h-4 w-4 mr-1" /> : score < 55 ? <TrendingDown className="inline h-4 w-4 mr-1" /> : null}
                  {score}
                </span>
              ) : <span className="text-muted-foreground text-sm">Not scored</span>}
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Decision</div>
            <div className="mt-1">
              <span className={cn("rounded px-2 py-1 text-sm font-medium", getStatusColor(decision))}>{decision}</span>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Estimated Value</div>
            <div className="text-lg font-bold mt-1">{tender.estimatedValue ? formatCurrency(tender.estimatedValue) : "—"}</div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Deadline</div>
            <div className={cn("text-sm font-medium mt-1", deadlineOverdue ? "text-red-600" : deadlineSoon ? "text-orange-600" : "")}>
              {deadlineOverdue ? "⚠ OVERDUE" : formatDate(tender.deadline)}
            </div>
          </div>
        </div>

        {/* Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-5 bg-white space-y-3">
            <div className="font-medium text-sm">Tender Details</div>
            <div className="space-y-2 text-sm">
              {tender.tenderNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference No.</span>
                  <span className="font-mono text-xs">{tender.tenderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{tender.category || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Eligibility</span>
                <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
                  tender.eligibility === "AGPO" ? "bg-emerald-100 text-emerald-800" :
                  tender.eligibility === "OPEN" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"
                )}>{tender.eligibility}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stage</span>
                <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(tender.stage))}>
                  {formatLabel(tender.stage)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium", getStatusColor(tender.priority))}>
                  {tender.priority}
                </span>
              </div>
              {tender.client && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <Link href={`/crm/${tender.client.id}`} className="text-blue-600 hover:underline text-xs">
                    {tender.client.name}
                  </Link>
                </div>
              )}
              {tender.bidBondRequired && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bid Bond</span>
                  <span>{tender.bidBondAmount ? formatCurrency(tender.bidBondAmount) : "Required"}</span>
                </div>
              )}
            </div>
            {tender.notes && (
              <div className="pt-3 border-t text-xs text-muted-foreground whitespace-pre-wrap">{tender.notes}</div>
            )}
          </div>

          {/* Bid scoring */}
          <div className="border rounded-lg p-5 bg-white">
            <div className="font-medium text-sm mb-3">Bid / No-Bid Scoring</div>
            <div className="space-y-2">
              {SCORE_FIELDS.map(({ key, label, weight }) => {
                const val = tender[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground w-36 shrink-0">{label} <span className="text-muted-foreground/60">({weight})</span></div>
                    {val != null ? (
                      <>
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                          <div
                            className={cn("h-1.5 rounded-full", val >= 70 ? "bg-green-500" : val >= 50 ? "bg-yellow-500" : "bg-red-400")}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{val}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not scored</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Documents */}
        {tender.documents?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Documents ({tender.documents.length})</span>
            </div>
            <div className="divide-y">
              {tender.documents.map((d: any) => (
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

        {/* Open Tasks */}
        {tender.tasks?.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Open Tasks ({tender.tasks.length})</span>
            </div>
            <div className="divide-y">
              {tender.tasks.map((t: any) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className={cn(isOverdue(t.dueDate) ? "text-red-600 font-medium" : "")}>{t.title}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {t.assignee && <span>→ {t.assignee.name}</span>}
                    {t.dueDate && <span className={cn(isOverdue(t.dueDate) ? "text-red-600" : "")}>{formatDate(t.dueDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TenderFormModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={load} tender={tender} />
    </div>
  );
}
