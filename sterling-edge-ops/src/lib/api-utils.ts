import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import type { Session } from "next-auth";

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | "ADMIN"
  | "DIRECTOR"
  | "PROCUREMENT_OFFICER"
  | "FINANCE_OFFICER"
  | "VIEWER";

export interface AppSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role: UserRole;
  };
}

type RouteContext = { params?: Record<string, string> };

type AuthenticatedHandler = (
  req: NextRequest,
  session: AppSession,
  ctx: RouteContext
) => Promise<NextResponse> | NextResponse;

// ── Role constants ────────────────────────────────────────────────────────────

export const ALL_ROLES: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER", "VIEWER",
];
export const OPS_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "VIEWER",
];
export const OPS_WRITE: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER",
];
export const FINANCE_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "FINANCE_OFFICER",
];
export const CONTRACTS_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER", "VIEWER",
];
export const CONTRACTS_WRITE: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER",
];
export const DOCS_READ: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER", "VIEWER",
];
export const DOCS_WRITE: UserRole[] = [
  "ADMIN", "DIRECTOR", "PROCUREMENT_OFFICER", "FINANCE_OFFICER",
];
export const ADMIN_ONLY: UserRole[] = ["ADMIN"];

// ── Core wrapper ──────────────────────────────────────────────────────────────

/**
 * Wraps a route handler with authentication, RBAC, and centralised error handling.
 *
 * @param handler      — the actual route logic
 * @param allowedRoles — if provided, only these roles may call this handler;
 *                       VIEWER is always read-only regardless
 */
export function withAuth(
  handler: AuthenticatedHandler,
  allowedRoles?: UserRole[]
) {
  return async (req: NextRequest, ctx: RouteContext = {}) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const role = (session.user as any).role as UserRole;

      // Viewers are permanently read-only
      if (role === "VIEWER" && req.method !== "GET") {
        return NextResponse.json(
          { error: "Forbidden: your role has read-only access" },
          { status: 403 }
        );
      }

      // Route-level role check
      if (allowedRoles && !allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return await handler(req, session as AppSession, ctx);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ── Centralised error handler ─────────────────────────────────────────────────

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return NextResponse.json(
          { error: "A record with this value already exists" },
          { status: 409 }
        );
      case "P2025":
        return NextResponse.json({ error: "Record not found" }, { status: 404 });
      case "P2003":
        return NextResponse.json(
          { error: "Related record not found" },
          { status: 422 }
        );
      case "P2014":
        return NextResponse.json(
          { error: "Cannot delete: record is referenced by other records" },
          { status: 409 }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
  }

  console.error("[API Error]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
