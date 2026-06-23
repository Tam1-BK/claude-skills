import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const search = searchParams.get("search") ?? "";

  const documents = await prisma.document.findMany({
    where: {
      AND: [
        search ? { name: { contains: search, mode: "insensitive" } } : {},
        type ? { type: type as any } : {},
      ],
    },
    include: {
      client: { select: { name: true } },
      tender: { select: { tenderName: true } },
      supplier: { select: { name: true } },
      contract: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const userId = (session.user as any).id;

  const document = await prisma.document.create({
    data: {
      name: body.name,
      type: body.type,
      fileName: body.fileName ?? body.name,
      fileSize: body.fileSize ?? null,
      mimeType: body.mimeType ?? null,
      url: body.url ?? null,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      isVerified: body.isVerified ?? false,
      notes: body.notes,
      clientId: body.clientId || null,
      tenderId: body.tenderId || null,
      supplierId: body.supplierId || null,
      contractId: body.contractId || null,
      uploadedById: userId,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
