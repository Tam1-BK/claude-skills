import {
  PrismaClient, UserRole, ClientType, RelationshipStatus, PipelineStage,
  TenderEligibility, TenderStage, BidDecision, Priority, SupplierReliability,
  ContractStatus, RiskLevel, TaskStatus, TaskPriority, DocumentType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Sterling Edge Operations OS...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash("Admin@2024", 10);
  const userPwd = await bcrypt.hash("User@2024", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sterlingedge.co.ke" },
    update: {},
    create: { name: "James Kariuki", email: "admin@sterlingedge.co.ke", password: adminPwd, role: UserRole.ADMIN },
  });

  const director = await prisma.user.upsert({
    where: { email: "director@sterlingedge.co.ke" },
    update: {},
    create: { name: "Grace Mwangi", email: "director@sterlingedge.co.ke", password: userPwd, role: UserRole.DIRECTOR },
  });

  const procOfficer = await prisma.user.upsert({
    where: { email: "procurement@sterlingedge.co.ke" },
    update: {},
    create: { name: "Peter Omondi", email: "procurement@sterlingedge.co.ke", password: userPwd, role: UserRole.PROCUREMENT_OFFICER },
  });

  const financeOfficer = await prisma.user.upsert({
    where: { email: "finance@sterlingedge.co.ke" },
    update: {},
    create: { name: "Faith Njeri", email: "finance@sterlingedge.co.ke", password: userPwd, role: UserRole.FINANCE_OFFICER },
  });

  console.log("✅ Users (4)");

  // ── Clients / Procuring Entities ───────────────────────────────────────────
  const moh = await prisma.client.create({
    data: {
      name: "Ministry of Health",
      type: ClientType.MINISTRY,
      contactPerson: "Dr. Samuel Mutua",
      contactEmail: "procurement@health.go.ke",
      contactPhone: "+254 20 271 7077",
      physicalAddress: "Afya House, Cathedral Road, Nairobi",
      county: "Nairobi",
      relationshipOwner: "James Kariuki",
      ownerId: admin.id,
      lastInteraction: new Date("2024-11-15"),
      nextFollowUp: new Date("2024-12-20"),
      opportunityValue: 45000000,
      relationshipStatus: RelationshipStatus.ACTIVE,
      pipelineStage: PipelineStage.REQUIREMENTS_RECEIVED,
      priority: Priority.HIGH,
      tags: ["health", "pharmaceuticals", "medical-equipment"],
    },
  });

  const kenha = await prisma.client.create({
    data: {
      name: "Kenya National Highways Authority (KeNHA)",
      type: ClientType.AGENCY,
      contactPerson: "Eng. Collins Wachira",
      contactEmail: "procurement@kenha.co.ke",
      contactPhone: "+254 20 284 0000",
      physicalAddress: "Blue Shield Towers, Upper Hill, Nairobi",
      county: "Nairobi",
      relationshipOwner: "Grace Mwangi",
      ownerId: director.id,
      lastInteraction: new Date("2024-10-28"),
      nextFollowUp: new Date("2025-01-15"),
      opportunityValue: 120000000,
      relationshipStatus: RelationshipStatus.ACTIVE,
      pipelineStage: PipelineStage.QUOTE_SENT,
      priority: Priority.CRITICAL,
      tags: ["infrastructure", "road-construction", "civil-works"],
    },
  });

  const nhif = await prisma.client.create({
    data: {
      name: "National Hospital Insurance Fund (NHIF)",
      type: ClientType.AGENCY,
      contactPerson: "Ms. Caroline Achieng",
      contactEmail: "tenders@nhif.or.ke",
      contactPhone: "+254 20 272 5472",
      physicalAddress: "Hospital Hill Road, Nairobi",
      county: "Nairobi",
      relationshipOwner: "Peter Omondi",
      ownerId: procOfficer.id,
      lastInteraction: new Date("2024-11-01"),
      nextFollowUp: new Date("2025-01-30"),
      opportunityValue: 28000000,
      relationshipStatus: RelationshipStatus.ACTIVE,
      pipelineStage: PipelineStage.CONTACT_MADE,
      priority: Priority.HIGH,
      tags: ["insurance", "ICT", "software"],
    },
  });

  const nccGov = await prisma.client.create({
    data: {
      name: "Nairobi City County Government",
      type: ClientType.COUNTY_GOVERNMENT,
      contactPerson: "Mr. Amos Gitonga",
      contactEmail: "procurement@nairobicity.go.ke",
      contactPhone: "+254 20 215 0000",
      physicalAddress: "City Hall, City Hall Way, Nairobi",
      county: "Nairobi",
      relationshipOwner: "Peter Omondi",
      ownerId: procOfficer.id,
      lastInteraction: new Date("2024-09-30"),
      nextFollowUp: new Date("2025-01-15"),
      opportunityValue: 15000000,
      relationshipStatus: RelationshipStatus.ACTIVE,
      pipelineStage: PipelineStage.LEAD_IDENTIFIED,
      priority: Priority.MEDIUM,
      tags: ["county-government", "waste-management", "supplies"],
    },
  });

  const safaricom = await prisma.client.create({
    data: {
      name: "Safaricom PLC",
      type: ClientType.PRIVATE_COMPANY,
      registrationNumber: "C.2/2000",
      contactPerson: "Mr. David Kirima",
      contactEmail: "supply.chain@safaricom.co.ke",
      contactPhone: "+254 722 000 000",
      physicalAddress: "Safaricom House, Westlands, Nairobi",
      county: "Nairobi",
      website: "https://www.safaricom.co.ke",
      relationshipOwner: "Grace Mwangi",
      ownerId: director.id,
      lastInteraction: new Date("2024-11-20"),
      nextFollowUp: new Date("2025-01-10"),
      opportunityValue: 8500000,
      relationshipStatus: RelationshipStatus.ACTIVE,
      pipelineStage: PipelineStage.NEGOTIATION,
      priority: Priority.HIGH,
      tags: ["telecom", "ICT", "private-sector"],
    },
  });

  console.log("✅ Clients (5)");

  // ── Contacts (8) ──────────────────────────────────────────────────────────
  await prisma.contact.createMany({
    data: [
      { clientId: moh.id, name: "Dr. Samuel Mutua", title: "Director, Medical Supplies", email: "s.mutua@health.go.ke", phone: "+254 722 111 222", department: "Medical Supplies", isPrimary: true },
      { clientId: moh.id, name: "Ms. Jane Wanjiku", title: "Senior Procurement Officer", email: "j.wanjiku@health.go.ke", phone: "+254 733 222 333", department: "Procurement", isPrimary: false },
      { clientId: kenha.id, name: "Eng. Collins Wachira", title: "Head of Procurement", email: "c.wachira@kenha.co.ke", phone: "+254 722 333 444", department: "Procurement", isPrimary: true },
      { clientId: kenha.id, name: "Ms. Tabitha Maina", title: "Procurement Officer", email: "t.maina@kenha.co.ke", phone: "+254 711 444 555", department: "Procurement", isPrimary: false },
      { clientId: nhif.id, name: "Ms. Caroline Achieng", title: "Manager, Procurement", email: "c.achieng@nhif.or.ke", phone: "+254 722 555 666", department: "Procurement", isPrimary: true },
      { clientId: nccGov.id, name: "Mr. Amos Gitonga", title: "County Procurement Director", email: "a.gitonga@nairobi.go.ke", phone: "+254 733 666 777", department: "Procurement", isPrimary: true },
      { clientId: safaricom.id, name: "Mr. David Kirima", title: "Supply Chain Manager", email: "d.kirima@safaricom.co.ke", phone: "+254 722 000 001", department: "Supply Chain", isPrimary: true },
      { clientId: safaricom.id, name: "Ms. Ruth Kamau", title: "Vendor Relations Officer", email: "r.kamau@safaricom.co.ke", phone: "+254 733 000 002", department: "Procurement", isPrimary: false },
    ],
  });

  console.log("✅ Contacts (8)");

  // ── Suppliers (6) ─────────────────────────────────────────────────────────
  const medtech = await prisma.supplier.create({
    data: {
      name: "MedTech Supplies Ltd",
      registrationNumber: "C.123456/2015",
      kraPin: "P051234567K",
      category: "Medical Equipment & Supplies",
      subcategory: "Consumables & Disposables",
      contactPerson: "Robert Njoroge",
      contactEmail: "orders@medtech.co.ke",
      contactPhone: "+254 722 500 100",
      physicalAddress: "Industrial Area, Nairobi",
      county: "Nairobi",
      reliability: SupplierReliability.EXCELLENT,
      deliveryCapacity: "Up to 5,000 units per week",
      creditTerms: "Net 30 days",
      paymentTerms: "30% deposit, 70% on delivery",
      leadTimeDays: 14,
      minimumOrderValue: 50000,
      pastPerformance: "Supplied MOH for 3 years — zero delivery failures",
      requiredCerts: ["ISO 9001", "KEBS Certification", "MOH Approval"],
      tags: ["medical", "trusted", "agpo-eligible"],
    },
  });

  const eastfield = await prisma.supplier.create({
    data: {
      name: "Eastfield Hardware & Construction Ltd",
      category: "Construction Materials",
      subcategory: "Civil Works Materials",
      contactPerson: "Ali Hassan",
      contactEmail: "sales@eastfieldhardware.co.ke",
      contactPhone: "+254 733 600 200",
      physicalAddress: "Eastleigh, Nairobi",
      county: "Nairobi",
      reliability: SupplierReliability.GOOD,
      deliveryCapacity: "Full truckload (30 tonnes)",
      creditTerms: "Net 21 days",
      paymentTerms: "50% on LPO, 50% on delivery",
      leadTimeDays: 7,
      minimumOrderValue: 100000,
      requiredCerts: ["NCA Registration"],
      tags: ["construction", "civil-works"],
    },
  });

  const techvision = await prisma.supplier.create({
    data: {
      name: "TechVision ICT Solutions",
      category: "ICT Equipment & Services",
      subcategory: "Computers, Networking, Software",
      contactPerson: "Susan Kamau",
      contactEmail: "procurement@techvision.co.ke",
      contactPhone: "+254 711 700 300",
      physicalAddress: "Westlands, Nairobi",
      county: "Nairobi",
      website: "https://www.techvision.co.ke",
      reliability: SupplierReliability.GOOD,
      deliveryCapacity: "200 units per week",
      creditTerms: "Net 14 days",
      paymentTerms: "100% upfront for first order",
      leadTimeDays: 21,
      minimumOrderValue: 200000,
      requiredCerts: ["Microsoft Partner", "CISCO Certified"],
      tags: ["ICT", "computers", "networking"],
    },
  });

  const greenvalley = await prisma.supplier.create({
    data: {
      name: "Green Valley Office Supplies",
      category: "Office Supplies & Stationery",
      contactPerson: "Mary Wambui",
      contactEmail: "orders@greenvalley.co.ke",
      contactPhone: "+254 700 800 400",
      physicalAddress: "Ngara, Nairobi",
      county: "Nairobi",
      reliability: SupplierReliability.AVERAGE,
      deliveryCapacity: "Next day delivery within Nairobi",
      creditTerms: "Net 7 days",
      paymentTerms: "COD or Net 7",
      leadTimeDays: 2,
      minimumOrderValue: 5000,
      requiredCerts: [],
      tags: ["office-supplies", "stationery", "agpo-eligible"],
    },
  });

  const translogix = await prisma.supplier.create({
    data: {
      name: "TransLogix Freight & Clearing",
      category: "Logistics & Freight Forwarding",
      subcategory: "Clearing, Forwarding & Warehousing",
      contactPerson: "Daniel Mwema",
      contactEmail: "ops@translogix.co.ke",
      contactPhone: "+254 722 900 500",
      physicalAddress: "Mombasa Road, Nairobi",
      county: "Nairobi",
      reliability: SupplierReliability.GOOD,
      deliveryCapacity: "20ft and 40ft containers, bonded warehouse",
      creditTerms: "Net 14 days",
      paymentTerms: "50% on booking, 50% on delivery",
      leadTimeDays: 10,
      minimumOrderValue: 30000,
      requiredCerts: ["KRA Customs Agent", "KPA Registered"],
      tags: ["logistics", "freight", "clearing", "exim"],
    },
  });

  const pharmaceutique = await prisma.supplier.create({
    data: {
      name: "PharmaQue Distributors Ltd",
      category: "Pharmaceutical Products",
      subcategory: "Generic & Brand Medicines",
      contactPerson: "Dr. Patricia Wekesa",
      contactEmail: "procurement@pharmaque.co.ke",
      contactPhone: "+254 733 100 600",
      physicalAddress: "Upper Hill, Nairobi",
      county: "Nairobi",
      reliability: SupplierReliability.GOOD,
      deliveryCapacity: "Cold-chain capable, 2-tonne per delivery",
      creditTerms: "Net 45 days",
      paymentTerms: "60% on LPO, 40% on delivery",
      leadTimeDays: 21,
      minimumOrderValue: 150000,
      pastPerformance: "KEBS-certified lab supplier for 5+ years",
      requiredCerts: ["PPB License", "ISO 9001", "KEBS"],
      tags: ["pharma", "medicines", "cold-chain"],
    },
  });

  console.log("✅ Suppliers (6)");

  // ── Price History ──────────────────────────────────────────────────────────
  await prisma.supplierPriceHistory.createMany({
    data: [
      { supplierId: medtech.id, item: "Surgical Gloves (Box of 100)", unit: "Box", price: 850, date: new Date("2024-09-01") },
      { supplierId: medtech.id, item: "Surgical Gloves (Box of 100)", unit: "Box", price: 920, date: new Date("2024-11-01") },
      { supplierId: medtech.id, item: "IV Cannula 20G (Box of 50)", unit: "Box", price: 2400, date: new Date("2024-11-01") },
      { supplierId: techvision.id, item: "Desktop Computer (Core i7, 16GB, 512GB SSD)", unit: "Unit", price: 75000, date: new Date("2024-10-01") },
      { supplierId: techvision.id, item: "HP LaserJet Pro Printer", unit: "Unit", price: 28000, date: new Date("2024-10-01") },
      { supplierId: greenvalley.id, item: "A4 Copy Paper (Box of 5 reams)", unit: "Box", price: 2100, date: new Date("2024-11-01") },
    ],
  });

  // ── Tenders (6) ──────────────────────────────────────────────────────────
  // Tender 1: Strong opportunity — AGPO medical, high score
  const t1 = await prisma.tender.create({
    data: {
      tenderName: "Supply of Medical Consumables and Disposables FY 2024/2025",
      tenderNumber: "MOH/PROC/2024/089",
      procuringEntity: "Ministry of Health",
      clientId: moh.id,
      category: "Medical Supplies",
      eligibility: TenderEligibility.AGPO,
      deadline: new Date("2025-01-28"),
      bidBondRequired: true,
      bidBondAmount: 500000,
      estimatedValue: 18000000,
      stage: TenderStage.PRICING,
      bidDecision: BidDecision.PURSUE,
      bidScore: 78,
      evaluationRisk: "Medium — tight deadline for compliance docs, but AGPO advantage",
      mandatoryDocuments: ["Company Registration", "AGPO Certificate", "KRA PIN", "Tax Compliance", "CR12", "Audited Accounts"],
      requiredLicenses: ["Pharmacy & Poisons Board Registration"],
      technicalRequirements: "Min supply capacity of 2,000 units/week. ISO preferred.",
      financialRequirements: "Min annual turnover KES 5M. Audited accounts required.",
      priority: Priority.HIGH,
      eligibilityScore: 90, capitalScore: 65, deadlineScore: 55, documentScore: 80,
      supplierScore: 85, marginScore: 75, relationshipScore: 80, licenseScore: 70, paymentRiskScore: 60,
      notes: "Strong relationship with procurement director. AGPO advantage. Need PPB registration.",
    },
  });

  // Tender 2: ICT equipment NHIF
  const t2 = await prisma.tender.create({
    data: {
      tenderName: "Provision of ICT Equipment — Computers, Printers & Networking",
      tenderNumber: "NHIF/ICT/2024/034",
      procuringEntity: "National Hospital Insurance Fund",
      clientId: nhif.id,
      category: "ICT Equipment",
      eligibility: TenderEligibility.OPEN,
      deadline: new Date("2025-02-15"),
      bidBondRequired: true,
      bidBondAmount: 250000,
      estimatedValue: 12500000,
      stage: TenderStage.DOCUMENTS_GATHERING,
      bidDecision: BidDecision.PURSUE,
      bidScore: 72,
      evaluationRisk: "Low-Medium — competitive but ICT supplier well-positioned",
      mandatoryDocuments: ["Company Registration", "KRA PIN", "Tax Compliance", "CR12", "Bid Bond"],
      requiredLicenses: ["ICT Authority Registration"],
      technicalRequirements: "150 desktop computers, 30 printers, structured cabling installation.",
      priority: Priority.HIGH,
      eligibilityScore: 70, capitalScore: 70, deadlineScore: 75, documentScore: 75,
      supplierScore: 80, marginScore: 70, relationshipScore: 65, licenseScore: 80, paymentRiskScore: 70,
      notes: "Good margin opportunity. TechVision confirmed availability.",
    },
  });

  // Tender 3: High-risk / MONITOR — large capital requirement
  const t3 = await prisma.tender.create({
    data: {
      tenderName: "Supply of Road Construction Materials — Bitumen & Aggregate",
      tenderNumber: "KENHA/PROC/2024/112",
      procuringEntity: "Kenya National Highways Authority",
      clientId: kenha.id,
      category: "Civil Works Materials",
      eligibility: TenderEligibility.OPEN,
      deadline: new Date("2025-02-28"),
      bidBondRequired: true,
      bidBondAmount: 2000000,
      estimatedValue: 85000000,
      stage: TenderStage.UNDER_REVIEW,
      bidDecision: BidDecision.MONITOR,
      bidScore: 38,
      evaluationRisk: "HIGH — KES 85M contract requires NCA 7 license and KES 2M bid bond. Capital gap critical.",
      mandatoryDocuments: ["Company Registration", "KRA PIN", "Tax Compliance", "CR12", "NCA Registration", "Audited Accounts", "Bid Bond"],
      requiredLicenses: ["NCA Grade 7 and above", "NEMA Environmental Compliance"],
      technicalRequirements: "500 tonnes bitumen + 10,000 tonnes aggregate gravel.",
      financialRequirements: "Min net worth KES 50M demonstrated.",
      priority: Priority.MEDIUM,
      eligibilityScore: 40, capitalScore: 15, deadlineScore: 70, documentScore: 40,
      supplierScore: 45, marginScore: 60, relationshipScore: 75, licenseScore: 20, paymentRiskScore: 50,
      notes: "⚠ HIGH RISK. Capital gap: KES 85M. Missing NCA 7 license. Monitor unless JV partner found.",
    },
  });

  // Tender 4: AGPO office supplies — pursue
  const t4 = await prisma.tender.create({
    data: {
      tenderName: "Supply of Office Stationery, Consumables & Cleaning Supplies",
      tenderNumber: "NCC/ADM/2024/067",
      procuringEntity: "Nairobi City County Government",
      clientId: nccGov.id,
      category: "Office Supplies",
      eligibility: TenderEligibility.AGPO,
      deadline: new Date("2025-01-20"),
      bidBondRequired: false,
      estimatedValue: 3200000,
      stage: TenderStage.IDENTIFIED,
      bidDecision: BidDecision.PURSUE,
      bidScore: 85,
      evaluationRisk: "Low — small value, AGPO, good document readiness",
      mandatoryDocuments: ["Company Registration", "AGPO Certificate", "KRA PIN", "Tax Compliance"],
      requiredLicenses: [],
      priority: Priority.MEDIUM,
      eligibilityScore: 90, capitalScore: 90, deadlineScore: 65, documentScore: 90,
      supplierScore: 85, marginScore: 70, relationshipScore: 60, licenseScore: 95, paymentRiskScore: 60,
      notes: "Low risk, AGPO category. County payment is slow — factor 90 days into cash flow.",
    },
  });

  // Tender 5: Already SUBMITTED — awaiting award
  const t5 = await prisma.tender.create({
    data: {
      tenderName: "Provision of Security Guarding Services — Head Office & Branches",
      tenderNumber: "SAFCOM/CORP/2024/008",
      procuringEntity: "Safaricom PLC",
      clientId: safaricom.id,
      category: "Security Services",
      eligibility: TenderEligibility.RESTRICTED,
      deadline: new Date("2025-01-20"),
      bidBondRequired: false,
      estimatedValue: 8500000,
      stage: TenderStage.SUBMITTED,
      submittedAt: new Date("2024-11-20"),
      bidDecision: BidDecision.PURSUE,
      bidScore: 68,
      evaluationRisk: "Medium — outside core competency, need licensed security sub-contractor",
      mandatoryDocuments: ["Company Registration", "KRA PIN", "Tax Compliance", "Security Industry License"],
      requiredLicenses: ["Private Security Regulatory Authority (PSRA) License"],
      priority: Priority.HIGH,
      eligibilityScore: 60, capitalScore: 80, deadlineScore: 85, documentScore: 70,
      supplierScore: 60, marginScore: 55, relationshipScore: 90, licenseScore: 50, paymentRiskScore: 85,
      notes: "Submitted Nov 20. Partnering with Apex Security Ltd (PSRA licensed). Awaiting evaluation.",
    },
  });

  // Tender 6: LOST tender — for historical tracking
  const t6 = await prisma.tender.create({
    data: {
      tenderName: "Supply and Installation of Solar Energy Systems — Rural Health Centres",
      tenderNumber: "MOH/ENERGY/2024/022",
      procuringEntity: "Ministry of Health",
      clientId: moh.id,
      category: "Renewable Energy",
      eligibility: TenderEligibility.OPEN,
      deadline: new Date("2024-10-30"),
      bidBondRequired: true,
      bidBondAmount: 350000,
      estimatedValue: 22000000,
      stage: TenderStage.LOST,
      bidDecision: BidDecision.PURSUE,
      bidScore: 55,
      evaluationRisk: "Lost — lower bid by competitor by KES 1.2M. Technical score tied.",
      mandatoryDocuments: ["Company Registration", "KRA PIN", "Tax Compliance", "CR12", "Bid Bond", "ERC License"],
      requiredLicenses: ["ERC Contractor License"],
      priority: Priority.HIGH,
      eligibilityScore: 65, capitalScore: 60, deadlineScore: 80, documentScore: 70,
      supplierScore: 50, marginScore: 45, relationshipScore: 70, licenseScore: 60, paymentRiskScore: 55,
      notes: "LOST. Outbid by Brightfield Energy Ltd at KES 20.8M vs our KES 22M. Lesson: price more aggressively on energy.",
    },
  });

  console.log("✅ Tenders (6)");

  // ── Contracts / Orders (4) ────────────────────────────────────────────────
  // Contract 1: Goods in transit — active
  const c1 = await prisma.contract.create({
    data: {
      title: "Supply of Surgical Consumables — MOH Q4 2024",
      contractNumber: "MOH/CONT/2024/045",
      clientId: moh.id,
      supplierId: medtech.id,
      tenderId: t1.id,
      contractValue: 4200000,
      costOfGoods: 3150000,
      logisticsCost: 120000,
      otherCosts: 50000,
      marginEstimate: 20.95,
      grossMargin: 20.95,
      deliveryDeadline: new Date("2025-01-15"),
      paymentTerms: "Net 30 days from delivery and acceptance",
      expectedPaymentDate: new Date("2025-02-15"),
      supplierPaymentDate: new Date("2025-01-10"),
      financingRequired: true,
      financingAmount: 1500000,
      workingCapital: 3320000,
      financingGap: 1820000,
      status: ContractStatus.GOODS_IN_TRANSIT,
      riskLevel: RiskLevel.MEDIUM,
      expectedProfit: 880000,
      notes: "Goods dispatched from MedTech Dec 28. Expected delivery Jan 5. MOH stores manager: John Mwangi.",
    },
  });

  // Contract 2: Invoiced — pending payment (largest financing gap)
  const c2 = await prisma.contract.create({
    data: {
      title: "ICT Equipment Supply — NHIF Pilot Phase (50 Computers)",
      contractNumber: "NHIF/CONT/2024/012",
      clientId: nhif.id,
      supplierId: techvision.id,
      contractValue: 2850000,
      costOfGoods: 2200000,
      logisticsCost: 45000,
      otherCosts: 30000,
      marginEstimate: 20.17,
      grossMargin: 20.17,
      deliveryDeadline: new Date("2024-12-20"),
      paymentTerms: "60 days from invoice date",
      expectedPaymentDate: new Date("2025-02-28"),
      supplierPaymentDate: new Date("2024-12-15"),
      financingRequired: true,
      financingAmount: 1100000,
      workingCapital: 2275000,
      financingGap: 1175000,
      status: ContractStatus.INVOICED,
      riskLevel: RiskLevel.MEDIUM,
      expectedProfit: 575000,
      notes: "Delivery completed Dec 15. Invoice submitted Dec 16. Payment due Feb 28. Follow up end of Jan.",
    },
  });

  // Contract 3: Won contract (PAID) — for finance history
  const c3 = await prisma.contract.create({
    data: {
      title: "Office Furniture & Equipment — Safaricom Westlands Fit-out",
      contractNumber: "SAFCOM/PO/2024/234",
      clientId: safaricom.id,
      contractValue: 1850000,
      costOfGoods: 1200000,
      logisticsCost: 80000,
      otherCosts: 20000,
      marginEstimate: 29.7,
      grossMargin: 29.7,
      deliveryDeadline: new Date("2024-11-30"),
      paymentTerms: "30 days from acceptance",
      expectedPaymentDate: new Date("2024-12-30"),
      supplierPaymentDate: new Date("2024-11-25"),
      financingRequired: false,
      workingCapital: 1300000,
      financingGap: 0,
      status: ContractStatus.PAID,
      riskLevel: RiskLevel.LOW,
      expectedProfit: 550000,
      notes: "WON. Paid Dec 28. Excellent execution — use as reference for future Safaricom bids.",
    },
  });

  // Contract 4: Awarded (sourcing phase) — new logistics contract
  const c4 = await prisma.contract.create({
    data: {
      title: "Supply of Printed Stationery & Branded Materials — NCC 2025",
      contractNumber: "NCC/LPO/2025/003",
      clientId: nccGov.id,
      supplierId: greenvalley.id,
      contractValue: 1480000,
      costOfGoods: 980000,
      logisticsCost: 55000,
      otherCosts: 25000,
      marginEstimate: 28.4,
      grossMargin: 28.4,
      deliveryDeadline: new Date("2025-02-28"),
      paymentTerms: "Net 90 days (county payment cycle)",
      expectedPaymentDate: new Date("2025-05-31"),
      supplierPaymentDate: new Date("2025-03-15"),
      financingRequired: true,
      financingAmount: 500000,
      workingCapital: 1060000,
      financingGap: 560000,
      status: ContractStatus.SOURCING,
      riskLevel: RiskLevel.HIGH,
      expectedProfit: 420000,
      notes: "⚠ County payment risk — historically pays in 90-120 days. Confirm LPO authenticity before ordering.",
    },
  });

  console.log("✅ Contracts (4)");

  // ── Payments ──────────────────────────────────────────────────────────────
  await prisma.payment.createMany({
    data: [
      { contractId: c2.id, amount: 2850000, type: "CLIENT_PAYMENT", dueDate: new Date("2025-02-28"), status: "PENDING", notes: "60-day payment — invoice submitted Dec 16" },
      { contractId: c2.id, amount: 1100000, type: "SUPPLIER_PAYMENT", dueDate: new Date("2024-12-15"), paidDate: new Date("2024-12-14"), status: "PAID", reference: "MPESA-TXN-789012", notes: "Paid to TechVision on delivery" },
      { contractId: c3.id, amount: 1850000, type: "CLIENT_PAYMENT", dueDate: new Date("2024-12-30"), paidDate: new Date("2024-12-28"), status: "PAID", reference: "SAFCOM-PAY-2024-456", notes: "Paid early. Good client." },
      { contractId: c4.id, amount: 1480000, type: "CLIENT_PAYMENT", dueDate: new Date("2025-05-31"), status: "PENDING", notes: "Net 90 days county cycle — high payment risk" },
    ],
  });

  // ── Tasks (10) ────────────────────────────────────────────────────────────
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const in3days = new Date(today); in3days.setDate(today.getDate() + 3);
  const in7days = new Date(today); in7days.setDate(today.getDate() + 7);
  const in14days = new Date(today); in14days.setDate(today.getDate() + 14);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  await prisma.task.createMany({
    data: [
      { title: "Renew Tax Compliance Certificate (TCC)", description: "Current TCC expires Dec 31. Apply via iTax portal.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.URGENT, dueDate: in3days, assigneeId: procOfficer.id, creatorId: admin.id, tenderId: t1.id, notes: "Log in to itax.kra.go.ke → Tax Compliance → Generate TCC" },
      { title: "Request KES 500K bid bond from Equity Bank", description: "Required for MOH tender MOH/PROC/2024/089 deadline Jan 28", status: TaskStatus.TODO, priority: TaskPriority.URGENT, dueDate: tomorrow, assigneeId: financeOfficer.id, creatorId: admin.id, tenderId: t1.id, notes: "Call Joseph Maina (Equity RM) — +254 722 XXX XXX. Processing time 3-5 days." },
      { title: "Follow up on NHIF invoice payment", description: "Invoice NHIF-INV-2024-012 for KES 2.85M due Feb 28. Call ahead of time.", status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: new Date("2025-01-31"), assigneeId: financeOfficer.id, creatorId: director.id, contractId: c2.id, clientId: nhif.id, notes: "Call Ms. Caroline Achieng before Feb 15" },
      { title: "Obtain Pharmacy & Poisons Board (PPB) registration", description: "Required for MOH medical supplies tender. Apply via PPB portal.", status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: in7days, assigneeId: procOfficer.id, creatorId: admin.id, tenderId: t1.id, notes: "PPB processing takes 2-3 weeks. Expedite immediately." },
      { title: "Collect MOH delivery note for Batch 1", description: "Goods arrived. Get signed delivery note from MOH stores manager.", status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: in3days, assigneeId: procOfficer.id, creatorId: admin.id, contractId: c1.id, notes: "MOH Stores Manager: John Mwangi, Afya House warehouse B" },
      { title: "Complete NHIF ICT tender technical response", description: "Write methodology and compliance sections for NHIF/ICT/2024/034", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: in14days, assigneeId: procOfficer.id, creatorId: director.id, tenderId: t2.id, notes: "TechVision specs received. Methodology section pending." },
      { title: "Explore JV partner for KeNHA road materials tender", description: "Tender requires NCA 7 license and KES 2M bid bond. Need JV partner.", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: in14days, assigneeId: director.id, creatorId: admin.id, clientId: kenha.id, tenderId: t3.id, notes: "Contact: Nairobi Construction Association for referrals" },
      { title: "Download NCC office supplies tender documents", description: "Download official tender docs from IFMIS portal for NCC/ADM/2024/067", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, dueDate: in7days, assigneeId: procOfficer.id, creatorId: admin.id, tenderId: t4.id, notes: "AGPO category — get all mandatory documents ready." },
      { title: "Verify NCC County LPO authenticity before ordering", description: "⚠ High payment risk. Confirm LPO is authentic before committing to Green Valley", status: TaskStatus.TODO, priority: TaskPriority.HIGH, dueDate: in3days, assigneeId: admin.id, creatorId: director.id, contractId: c4.id, clientId: nccGov.id, notes: "Call Procurement Director Amos Gitonga to verify LPO No. NCC/LPO/2025/003" },
      { title: "Update Safaricom Q1 2025 relationship meeting", description: "Send meeting request and Q1 proposal to David Kirima at Safaricom", status: TaskStatus.DONE, priority: TaskPriority.LOW, dueDate: yesterday, assigneeId: director.id, creatorId: director.id, clientId: safaricom.id, completedAt: yesterday, notes: "Meeting scheduled for Jan 15. Prepare ICT and security services proposals." },
    ],
  });

  console.log("✅ Tasks (10)");

  // ── Documents (6) ─────────────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      { name: "Company Registration Certificate", type: DocumentType.COMPANY_REGISTRATION, fileName: "sterling_edge_company_reg.pdf", fileSize: 245000, mimeType: "application/pdf", isVerified: true, notes: "Certificate of incorporation — Sterling Edge Ltd" },
      { name: "AGPO Certificate 2024–2025", type: DocumentType.AGPO_CERTIFICATE, fileName: "agpo_certificate_2025.pdf", fileSize: 180000, mimeType: "application/pdf", isVerified: true, expiryDate: new Date("2025-06-30"), notes: "Youth enterprise AGPO — expires June 2025. Plan renewal May 2025." },
      { name: "Tax Compliance Certificate Q4 2024", type: DocumentType.TAX_COMPLIANCE, fileName: "tcc_q4_2024.pdf", fileSize: 155000, mimeType: "application/pdf", isVerified: true, expiryDate: new Date("2024-12-31"), notes: "⚠ URGENT: Expired Dec 31. Renewal in progress via iTax." },
      { name: "MOH Medical Supplies — Signed Contract", type: DocumentType.CONTRACT, fileName: "moh_contract_2024_045.pdf", fileSize: 850000, mimeType: "application/pdf", isVerified: true, contractId: c1.id, clientId: moh.id, notes: "Signed by both parties. Contract value KES 4.2M." },
      { name: "NHIF Invoice — ICT Equipment", type: DocumentType.INVOICE, fileName: "nhif_invoice_2024_012.pdf", fileSize: 220000, mimeType: "application/pdf", contractId: c2.id, clientId: nhif.id, notes: "Invoice No: NHIF-INV-2024-012. Amount: KES 2,850,000. Submitted Dec 16." },
      { name: "MOH Tender Official Document — Consumables 2024/089", type: DocumentType.BID_DOCUMENT, fileName: "moh_tender_doc_2024_089.pdf", fileSize: 1200000, mimeType: "application/pdf", tenderId: t1.id, notes: "Downloaded from IFMIS Dec 10. 48 pages." },
    ],
  });

  console.log("✅ Documents (6)");

  // ── Notes ──────────────────────────────────────────────────────────────────
  await prisma.note.createMany({
    data: [
      { content: "Spoke with Dr. Mutua — MOH is expanding medical supplies budget by 30% in Q1 2025. Strong relationship. He hinted at a drug supply framework contract worth KES 80M+. Position early.", authorId: admin.id, clientId: moh.id },
      { content: "NHIF payment confirmed by Ms. Achieng for Feb 28. She mentioned an upcoming biometric HR system tender (est. KES 15M). We should register interest.", authorId: procOfficer.id, clientId: nhif.id, contractId: c2.id },
      { content: "KeNHA planning a 2025 road rehabilitation programme worth KES 2B. Explore JV partnership with NCA-registered contractor to compete. This is a strategic multi-year play.", authorId: director.id, clientId: kenha.id },
      { content: "MOH goods in transit. MedTech driver number: +254 733 XXX XXX. Batch 1 = 60% of order. Batch 2 in 2 weeks. Need delivery note signed by Dr. Mutua's team.", authorId: procOfficer.id, contractId: c1.id },
      { content: "Equity Bank confirmed bid bond will be ready by Jan 22. Amount KES 500,000. Collect from main branch, Upper Hill. Our relationship manager is Joseph Maina.", authorId: financeOfficer.id, tenderId: t1.id },
      { content: "LOST: Solar energy tender MOH/ENERGY/2024/022. Outbid by Brightfield Energy by KES 1.2M. Our pricing was conservative on solar panels — next time price panels closer to market.", authorId: admin.id, tenderId: t6.id },
    ],
  });

  console.log("✅ Notes created");

  console.log("\n✅ Seed complete!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin:       admin@sterlingedge.co.ke  /  Admin@2024");
  console.log("  Director:    director@sterlingedge.co.ke  /  User@2024");
  console.log("  Procurement: procurement@sterlingedge.co.ke  /  User@2024");
  console.log("  Finance:     finance@sterlingedge.co.ke  /  User@2024");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
