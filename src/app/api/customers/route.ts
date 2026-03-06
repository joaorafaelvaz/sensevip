import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      skip,
      take: limit,
      orderBy: { lastSeenAt: "desc" },
      include: {
        detections: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: {
            satisfactionTag: true,
            expression: true,
            confidence: true,
            timestamp: true,
          },
        },
        _count: { select: { detections: true } },
      },
    }),
    prisma.customer.count(),
  ]);

  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      snapshotPath: c.snapshotPath,
      firstSeenAt: c.firstSeenAt,
      lastSeenAt: c.lastSeenAt,
      visitCount: c.visitCount,
      totalDetections: c._count.detections,
      lastDetection: c.detections[0] || null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
