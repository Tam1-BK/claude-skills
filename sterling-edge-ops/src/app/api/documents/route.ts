import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  withAuth, DOCS_READ, DOCS_WRITE, auditLog, noStore,
  parsePagination, paginated,
} from "@/lib/api-utils";
import { createDocumentSchema } from "@/lib/validations";

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const search = searchParams.get("search") ?? "";
  const pagination = parsePagination(searchParams);

  const where = {
    AND: [
      search ? { name: { contains: search, mode: "insensitive" as const } } : {},
      type ? { type: type as any } : {},
    ],
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        client: { select: { name: true } },
        tender: { select: { tenderName: true } },
        supplier: { select: { name: true } },
        contract: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  return noStore(NextResponse.json(paginated(documents, total, pagination)));
}, DOCS_READ);

export const POST = withAuth(async (req: NextRequest, session) => {
  const body = createDocumentSchema.parse(await req.json());

  const document = await prisma.document.create({
    data: {
      name: body.name,
      type: body.type,
      fileName: body.fileName ?? body.name,
      fileSize: body.fileSize ?? null,
      mimeType: body.mimeType ?? null,
      url: body.url || null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      isVerified: body.isVerified ?? false,
      notes: body.notes ?? null,
      clientId: body.clientId ?? null,
      tenderId: body.tenderId ?? null,
      supplierId: body.supplierId ?? null,
      contractId: body.contractId ?? null,
      uploadedById: session.user.id,
    },
  });

  auditLog(session.user.id, "CREATE", "document", document.id, { name: document.name });
  return NextResponse.json(document, { status: 201 });
}, DOCS_WRITE);
