export type UserRole =
  | "ADMIN"
  | "DIRECTOR"
  | "PROCUREMENT_OFFICER"
  | "FINANCE_OFFICER"
  | "VIEWER";

export const ALL_ROLES: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER", "VIEWER",
];
export const OPS_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "VIEWER",
];
export const FINANCE_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "FINANCE_OFFICER",
];
export const CONTRACTS_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER", "VIEWER",
];
export const DOCS_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER", "VIEWER",
];

export function canAccess(role: string | undefined, allowedRoles: UserRole[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role as UserRole);
}
