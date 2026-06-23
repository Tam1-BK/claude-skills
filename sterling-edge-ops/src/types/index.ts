export type { User, Client, Contact, Tender, Supplier, SupplierPriceHistory, Contract, Payment, Task, Note, Document } from "@prisma/client";

export type UserWithRole = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
};

export type DashboardStats = {
  activeTenders: number;
  tendersDueSoon: number;
  activeContracts: number;
  pendingPayments: number;
  totalPipelineValue: number;
  totalContractValue: number;
  tasksToday: number;
  overdueTasksCount: number;
  wonContracts: number;
  cashExposure: number;
};
