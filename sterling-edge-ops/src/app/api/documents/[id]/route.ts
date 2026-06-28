import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, DOCS_READ, DOCS_WRITE, auditLog, noStore } from "@/lib/api-utils";
import { updateDocumentSchema } from "@/lib/validations";

export const GET = withAuth(async (_req: NextRequest, _session, ctx) => {
  const { id } = ctx.params!;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      tender: { select: { tenderName: true } },
      supplier: { select: { name: true } },
      contract: { select: { title: true } },
    },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return noStore(NextResponse.json(document));
}, DOCS_READ);

export const PATCH = withAuth(async (req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  const body = updateDocumentSchema.parse(await req.json());

  const document = await prisma.document.update({
    where: { id },
    data: {
      ...(body.name != null && { name: body.name }),
      ...(body.type != null && { type: body.type }),
      ...(body.fileName != null && { fileName: body.fileName }),
      ...(body.fileSize !== undefined && { fileSize: body.fileSize }),
      ...(body.mimeType !== undefined && { mimeType: body.mimeType }),
      ...(body.url !== undefined && { url: body.url || null }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.isVerified !== undefined && { isVerified: body.isVerified }),
      ...(body.expiryDate !== undefined && {
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      }),
    },
  });

  auditLog(session.user.id, "UPDATE", "document", id);
  return NextResponse.json(document);
}, DOCS_WRITE);

export const DELETE = withAuth(async (_req: NextRequest, session, ctx) => {
  const { id } = ctx.params!;
  await prisma.document.delete({ where: { id } });
  auditLog(session.user.id, "DELETE", "document", id);
  return NextResponse.json({ success: true });
}, DOCS_WRITE);
