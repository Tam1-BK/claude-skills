import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  return isBefore(new Date(date), new Date());
}

export function isDueSoon(date: Date | string | null | undefined, days = 7): boolean {
  if (!date) return false;
  const d = new Date(date);
  return isAfter(d, new Date()) && isBefore(d, addDays(new Date(), days));
}

export function calcBidScore(scores: {
  eligibilityScore?: number | null;
  capitalScore?: number | null;
  deadlineScore?: number | null;
  documentScore?: number | null;
  supplierScore?: number | null;
  marginScore?: number | null;
  relationshipScore?: number | null;
  licenseScore?: number | null;
  paymentRiskScore?: number | null;
}): number {
  const weights = {
    eligibilityScore: 0.20,
    capitalScore: 0.15,
    deadlineScore: 0.10,
    documentScore: 0.15,
    supplierScore: 0.10,
    marginScore: 0.10,
    relationshipScore: 0.10,
    licenseScore: 0.05,
    paymentRiskScore: 0.05,
  };
  let total = 0;
  let weightSum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const val = scores[key as keyof typeof scores];
    if (val != null) {
      total += val * weight;
      weightSum += weight;
    }
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

export function getBidScoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 55) return "text-yellow-600";
  return "text-red-600";
}

export function getBidScoreBg(score: number): string {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 55) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    // Contract statuses
    AWARDED: "bg-blue-100 text-blue-800",
    SOURCING: "bg-purple-100 text-purple-800",
    PO_ISSUED: "bg-indigo-100 text-indigo-800",
    GOODS_IN_TRANSIT: "bg-cyan-100 text-cyan-800",
    DELIVERED: "bg-teal-100 text-teal-800",
    INVOICED: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-800",
    DISPUTED: "bg-red-100 text-red-800",
    // Tender stages
    IDENTIFIED: "bg-slate-100 text-slate-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    DOCUMENTS_GATHERING: "bg-purple-100 text-purple-800",
    PRICING: "bg-indigo-100 text-indigo-800",
    TECHNICAL_RESPONSE: "bg-cyan-100 text-cyan-800",
    LEGAL_REVIEW: "bg-orange-100 text-orange-800",
    SUBMITTED: "bg-teal-100 text-teal-800",
    AWAITING_AWARD: "bg-yellow-100 text-yellow-800",
    WON: "bg-green-100 text-green-800",
    LOST: "bg-red-100 text-red-800",
    DECLINED: "bg-gray-100 text-gray-800",
    // Pipeline stages
    LEAD_IDENTIFIED: "bg-slate-100 text-slate-800",
    CONTACT_MADE: "bg-blue-100 text-blue-800",
    REQUIREMENTS_RECEIVED: "bg-indigo-100 text-indigo-800",
    QUOTE_SENT: "bg-purple-100 text-purple-800",
    NEGOTIATION: "bg-orange-100 text-orange-800",
    DORMANT: "bg-gray-100 text-gray-800",
    // Task statuses
    TODO: "bg-slate-100 text-slate-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    BLOCKED: "bg-red-100 text-red-800",
    DONE: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    // Bid decision
    PURSUE: "bg-green-100 text-green-800",
    DECLINE: "bg-red-100 text-red-800",
    MONITOR: "bg-yellow-100 text-yellow-800",
    PENDING: "bg-slate-100 text-slate-800",
    // Relationship
    ACTIVE: "bg-green-100 text-green-800",
    PROSPECT: "bg-blue-100 text-blue-800",
    BLACKLISTED: "bg-red-100 text-red-800",
    // Priority / risk
    LOW: "bg-green-100 text-green-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    HIGH: "bg-orange-100 text-orange-800",
    CRITICAL: "bg-red-100 text-red-800",
    URGENT: "bg-red-100 text-red-800",
    // Reliability
    EXCELLENT: "bg-green-100 text-green-800",
    GOOD: "bg-teal-100 text-teal-800",
    AVERAGE: "bg-yellow-100 text-yellow-800",
    POOR: "bg-orange-100 text-orange-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatMillions(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}
