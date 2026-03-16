import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const recent = await prisma.detection.findMany({
    orderBy: { timestamp: "desc" },
    take: 10,
    select: {
      id: true,
      expression: true,
      satisfactionTag: true,
      confidence: true,
      rawExpressions: true,
      timestamp: true,
    },
  });

  return NextResponse.json(
    recent.map((d) => ({
      id: d.id.slice(0, 8),
      time: d.timestamp.toISOString().slice(11, 19),
      expression: d.expression,
      satisfaction: d.satisfactionTag,
      confidence: d.confidence.toFixed(3),
      scores: JSON.parse(d.rawExpressions),
    }))
  );
}
