import { z } from "zod";

// ── Shared enums ─────────────────────────────────────────────────────────────

const ClientTypeEnum = z.enum([
  "MINISTRY", "AGENCY", "COUNTY_GOVERNMENT", "PRIVATE_COMPANY",
  "NGO", "INTERNATIONAL_ORG", "INDIVIDUAL",
]);
const PipelineStageEnum = z.enum([
  "LEAD_IDENTIFIED", "CONTACT_MADE", "REQUIREMENTS_RECEIVED",
  "QUOTE_SENT", "NEGOTIATION", "WON", "LOST", "DORMANT",
]);
const RelationshipStatusEnum = z.enum(["ACTIVE", "DORMANT", "PROSPECT", "BLACKLISTED"]);
const PriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const TenderEligibilityEnum = z.enum(["AGPO", "OPEN", "RESTRICTED", "INTERNATIONAL"]);
const TenderStageEnum = z.enum([
  "IDENTIFIED", "UNDER_REVIEW", "DOCUMENTS_GATHERING", "PRICING",
  "TECHNICAL_RESPONSE", "LEGAL_REVIEW", "SUBMITTED", "AWAITING_AWARD",
  "WON", "LOST", "DECLINED",
]);
const BidDecisionEnum = z.enum(["PURSUE", "DECLINE", "MONITOR", "PENDING"]);
const SupplierReliabilityEnum = z.enum(["EXCELLENT", "GOOD", "AVERAGE", "POOR", "BLACKLISTED"]);
const ContractStatusEnum = z.enum([
  "AWARDED", "SOURCING", "PO_ISSUED", "GOODS_IN_TRANSIT",
  "DELIVERED", "INVOICED", "PAID", "CLOSED", "DISPUTED",
]);
const RiskLevelEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const TaskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "CANCELLED"]);
const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const DocumentTypeEnum = z.enum([
  "COMPANY_REGISTRATION", "AGPO_CERTIFICATE", "KRA_PIN", "TAX_COMPLIANCE",
  "CR12", "NCA_LICENSE", "NEMA_LICENSE", "SECTOR_LICENSE", "BID_DOCUMENT",
  "SUPPLIER_QUOTE", "LPO", "INVOICE", "DELIVERY_NOTE", "CONTRACT",
  "BANK_GUARANTEE", "BID_BOND", "PERFORMANCE_BOND", "INSURANCE", "OTHER",
]);

// Accepts string or number, coerces to float — for monetary/numeric form fields
const numericField = z.union([z.string(), z.number()])
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .nullable()
  .optional();

const scoreField = z.union([z.string(), z.number()])
  .transform((v) => (v === "" || v == null ? null : parseInt(String(v), 10)))
  .nullable()
  .optional();

// ── CRM ──────────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: ClientTypeEnum,
  registrationNumber: z.string().max(100).optional().nullable(),
  kraPin: z.string().max(50).optional().nullable(),
  contactPerson: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  contactPhone: z.string().max(50).optional().nullable(),
  physicalAddress: z.string().max(500).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  relationshipOwner: z.string().max(200).optional().nullable(),
  nextFollowUp: z.string().optional().nullable(),
  opportunityValue: numericField,
  relationshipStatus: RelationshipStatusEnum.optional().default("PROSPECT"),
  pipelineStage: PipelineStageEnum.optional().default("LEAD_IDENTIFIED"),
  priority: PriorityEnum.optional().default("MEDIUM"),
  tags: z.array(z.string()).optional().default([]),
});

export const updateClientSchema = createClientSchema.partial();

// ── Tenders ───────────────────────────────────────────────────────────────────

export const createTenderSchema = z.object({
  tenderName: z.string().min(1, "Tender name is required").max(500),
  procuringEntity: z.string().min(1, "Procuring entity is required").max(200),
  deadline: z.string().min(1, "Deadline is required"),
  tenderNumber: z.string().max(100).optional().nullable(),
  clientId: z.string().optional().nullable(),
  category: z.string().max(200).optional().nullable(),
  eligibility: TenderEligibilityEnum.optional().default("OPEN"),
  bidBondRequired: z.boolean().optional().default(false),
  bidBondAmount: numericField,
  estimatedValue: numericField,
  stage: TenderStageEnum.optional().default("IDENTIFIED"),
  bidDecision: BidDecisionEnum.optional().default("PENDING"),
  mandatoryDocuments: z.array(z.string()).optional().default([]),
  requiredLicenses: z.array(z.string()).optional().default([]),
  technicalRequirements: z.string().max(2000).optional().nullable(),
  financialRequirements: z.string().max(2000).optional().nullable(),
  priority: PriorityEnum.optional().default("MEDIUM"),
  notes: z.string().max(2000).optional().nullable(),
  eligibilityScore: scoreField,
  capitalScore: scoreField,
  deadlineScore: scoreField,
  documentScore: scoreField,
  supplierScore: scoreField,
  marginScore: scoreField,
  relationshipScore: scoreField,
  licenseScore: scoreField,
  paymentRiskScore: scoreField,
});

export const updateTenderSchema = createTenderSchema.partial();

// ── Suppliers ─────────────────────────────────────────────────────────────────

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  registrationNumber: z.string().max(100).optional().nullable(),
  kraPin: z.string().max(50).optional().nullable(),
  subcategory: z.string().max(100).optional().nullable(),
  contactPerson: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  contactPhone: z.string().max(50).optional().nullable(),
  physicalAddress: z.string().max(500).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  reliability: SupplierReliabilityEnum.optional().default("GOOD"),
  deliveryCapacity: z.string().max(500).optional().nullable(),
  creditTerms: z.string().max(500).optional().nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  leadTimeDays: numericField,
  minimumOrderValue: numericField,
  pastPerformance: z.string().max(2000).optional().nullable(),
  requiredCerts: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// ── Contracts ─────────────────────────────────────────────────────────────────

export const createContractSchema = z.object({
  title: z.string().min(1, "Contract title is required").max(300),
  clientId: z.string().min(1, "Client is required"),
  contractValue: z
    .union([z.string(), z.number()])
    .transform(Number)
    .refine((v) => v > 0, "Contract value must be greater than 0"),
  contractNumber: z.string().max(100).optional().nullable(),
  supplierId: z.string().optional().nullable(),
  tenderId: z.string().optional().nullable(),
  costOfGoods: numericField,
  logisticsCost: numericField,
  otherCosts: numericField,
  marginEstimate: numericField,
  deliveryDeadline: z.string().optional().nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  expectedPaymentDate: z.string().optional().nullable(),
  supplierPaymentDate: z.string().optional().nullable(),
  financingRequired: z.boolean().optional().default(false),
  financingAmount: numericField,
  status: ContractStatusEnum.optional().default("AWARDED"),
  riskLevel: RiskLevelEnum.optional().default("MEDIUM"),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateContractSchema = createContractSchema.partial();

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(300),
  description: z.string().max(2000).optional().nullable(),
  status: TaskStatusEnum.optional().default("TODO"),
  priority: TaskPriorityEnum.optional().default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  tenderId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

// ── Documents ─────────────────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required").max(300),
  type: DocumentTypeEnum,
  fileName: z.string().max(500).optional().nullable(),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
  url: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  expiryDate: z.string().optional().nullable(),
  isVerified: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
  clientId: z.string().optional().nullable(),
  tenderId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  contractId: z.string().optional().nullable(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

// ── Contacts ──────────────────────────────────────────────────────────────────

export const createContactSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  name: z.string().min(1, "Name is required").max(200),
  title: z.string().max(200).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().max(50).optional().nullable(),
  department: z.string().max(200).optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateContactSchema = createContactSchema.omit({ clientId: true }).partial();
