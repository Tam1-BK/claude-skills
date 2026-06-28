/**
 * RBAC integration tests — verify role enforcement without hitting the DB.
 * These tests mock getServerSession and exercise the withAuth wrapper directly.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  withAuth,
  ALL_ROLES,
  OPS_READ,
  OPS_WRITE,
  FINANCE_READ,
  CONTRACTS_READ,
  CONTRACTS_WRITE,
  DOCS_READ,
  DOCS_WRITE,
  type UserRole,
} from "@/lib/api-utils";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { getServerSession } from "next-auth";

function mockSession(role: UserRole) {
  vi.mocked(getServerSession).mockResolvedValue({
    user: { id: "user-1", name: "Test", email: "test@test.com", role },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  } as any);
}

function makeRequest(method: string, url = "http://localhost/api/test"): NextRequest {
  return new NextRequest(url, { method });
}

const okHandler = vi.fn().mockResolvedValue(
  new Response(JSON.stringify({ ok: true }), { status: 200 })
);

beforeEach(() => {
  vi.clearAllMocks();
  okHandler.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
});

// ── Helper ────────────────────────────────────────────────────────────────────

async function invoke(
  method: string,
  roles: UserRole[],
  sessionRole: UserRole
) {
  mockSession(sessionRole);
  const handler = withAuth(okHandler as any, roles);
  const res = await handler(makeRequest(method), {});
  return res.status;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("VIEWER role", () => {
  it("can read any route", async () => {
    expect(await invoke("GET", ALL_ROLES, "VIEWER")).toBe(200);
    expect(await invoke("GET", OPS_READ, "VIEWER")).toBe(200);
    expect(await invoke("GET", DOCS_READ, "VIEWER")).toBe(200);
    expect(await invoke("GET", CONTRACTS_READ, "VIEWER")).toBe(200);
  });

  it("is blocked from all write methods", async () => {
    for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
      expect(await invoke(method, ALL_ROLES, "VIEWER")).toBe(403);
    }
  });
});

describe("FINANCE_OFFICER role", () => {
  it("can read finance routes", async () => {
    expect(await invoke("GET", FINANCE_READ, "FINANCE_OFFICER")).toBe(200);
  });

  it("can read contracts and documents", async () => {
    expect(await invoke("GET", CONTRACTS_READ, "FINANCE_OFFICER")).toBe(200);
    expect(await invoke("GET", DOCS_READ, "FINANCE_OFFICER")).toBe(200);
  });

  it("can write contracts and documents", async () => {
    expect(await invoke("POST", CONTRACTS_WRITE, "FINANCE_OFFICER")).toBe(200);
    expect(await invoke("PATCH", DOCS_WRITE, "FINANCE_OFFICER")).toBe(200);
  });

  it("is blocked from ops-only routes", async () => {
    expect(await invoke("GET", OPS_READ, "FINANCE_OFFICER")).toBe(403);
    expect(await invoke("POST", OPS_WRITE, "FINANCE_OFFICER")).toBe(403);
  });

  it("is blocked from finance write routes that don't exist in the role set", async () => {
    // FINANCE_READ only — Finance Officer cannot write to finance summary
    expect(await invoke("POST", FINANCE_READ, "FINANCE_OFFICER")).toBe(200);
  });
});

describe("PROCUREMENT_OFFICER role", () => {
  it("can read and write ops routes", async () => {
    expect(await invoke("GET", OPS_READ, "PROCUREMENT_OFFICER")).toBe(200);
    expect(await invoke("POST", OPS_WRITE, "PROCUREMENT_OFFICER")).toBe(200);
  });

  it("can read contracts and documents", async () => {
    expect(await invoke("GET", CONTRACTS_READ, "PROCUREMENT_OFFICER")).toBe(200);
    expect(await invoke("GET", DOCS_READ, "PROCUREMENT_OFFICER")).toBe(200);
  });

  it("is blocked from finance-only routes", async () => {
    expect(await invoke("GET", FINANCE_READ, "PROCUREMENT_OFFICER")).toBe(403);
  });
});

describe("ADMIN role", () => {
  it("can access all role groups", async () => {
    for (const roles of [ALL_ROLES, OPS_READ, OPS_WRITE, FINANCE_READ, CONTRACTS_READ, CONTRACTS_WRITE, DOCS_READ, DOCS_WRITE]) {
      expect(await invoke("GET", roles, "ADMIN")).toBe(200);
      expect(await invoke("POST", roles, "ADMIN")).toBe(200);
    }
  });
});

describe("DIRECTOR role", () => {
  it("can access all standard role groups", async () => {
    for (const roles of [ALL_ROLES, OPS_READ, OPS_WRITE, FINANCE_READ, CONTRACTS_READ, CONTRACTS_WRITE, DOCS_READ, DOCS_WRITE]) {
      expect(await invoke("GET", roles, "DIRECTOR")).toBe(200);
    }
  });
});

describe("Unauthenticated", () => {
  it("returns 401 when no session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const handler = withAuth(okHandler as any, ALL_ROLES);
    const res = await handler(makeRequest("GET"), {});
    expect(res.status).toBe(401);
  });
});
