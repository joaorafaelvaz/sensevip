import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      detections: {
        orderBy: { timestamp: "desc" },
        take: 50,
      },
    },
  });

  if (!customer) {
    return NextResponse.json(
      { error: "Cliente nao encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ customer });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.customer.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
