import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FINANCE_ROLES = ["ADMIN", "DIRECTOR", "FINANCE_OFFICER"];
const MUTATING_METHODS = ["POST", "PATCH", "PUT", "DELETE"];

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl;
    const method = req.method;
    const token = req.nextauth?.token;
    const role: string | undefined = token?.role;

    // ── Unauthenticated API requests → 401 JSON (never redirect to /login) ──
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
      if (!token || token.active === false) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // ── CSRF: reject cross-origin state-changing requests ──────────────────
    if (MUTATING_METHODS.includes(method) && pathname.startsWith("/api/")) {
      const origin = req.headers.get("origin");
      const host = req.headers.get("host");
      if (origin) {
        try {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: "Forbidden: cross-origin request" }, { status: 403 });
          }
        } catch {
          return NextResponse.json({ error: "Forbidden: invalid origin" }, { status: 403 });
        }
      }
    }

    // ── Finance API — restricted read ──────────────────────────────────────
    if (pathname.startsWith("/api/finance")) {
      if (!role || !FINANCE_ROLES.includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Viewer enforcement ─────────────────────────────────────────────────
    if (role === "VIEWER" && MUTATING_METHODS.includes(method) && pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden: read-only access" }, { status: 403 });
    }

    // ── Finance Officer isolation ──────────────────────────────────────────
    if (role === "FINANCE_OFFICER") {
      const restricted = ["/api/crm", "/api/tenders", "/api/suppliers"];
      if (restricted.some((r) => pathname.startsWith(r))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Page routes: redirect to /login if no valid, active token
      // API routes: always pass through — the middleware function above returns 401 JSON
      authorized: ({ token, req }) => {
        const isApi =
          req.nextUrl.pathname.startsWith("/api/") &&
          !req.nextUrl.pathname.startsWith("/api/auth");
        if (isApi) return true; // custom middleware function handles API auth with JSON 401
        return !!token && token.active !== false;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|robots\\.txt).*)",
  ],
};
