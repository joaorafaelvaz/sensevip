import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { error: "Parametro date obrigatorio" },
      { status: 400 }
    );
  }

  const startOfDay = new Date(`${date}T00:00:00.000Z`);
  const endOfDay = new Date(`${date}T23:59:59.999Z`);

  const detections = await prisma.detection.findMany({
    where: { timestamp: { gte: startOfDay, lte: endOfDay } },
  });

  const uniqueCustomers = new Set(detections.map((d) => d.customerId));

  // Group by hour
  const hourlyData: Record<
    number,
    { satisfied: number; neutral: number; unsatisfied: number; total: number }
  > = {};

  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { satisfied: 0, neutral: 0, unsatisfied: 0, total: 0 };
  }

  for (const d of detections) {
    const hour = new Date(d.timestamp).getUTCHours();
    hourlyData[hour].total++;
    if (d.satisfactionTag === "SATISFIED") hourlyData[hour].satisfied++;
    else if (d.satisfactionTag === "NEUTRAL") hourlyData[hour].neutral++;
    else hourlyData[hour].unsatisfied++;
  }

  const satisfied = detections.filter(
    (d) => d.satisfactionTag === "SATISFIED"
  ).length;
  const neutral = detections.filter(
    (d) => d.satisfactionTag === "NEUTRAL"
  ).length;
  const unsatisfied = detections.filter(
    (d) => d.satisfactionTag === "UNSATISFIED"
  ).length;

  return NextResponse.json({
    date,
    totalCustomers: uniqueCustomers.size,
    totalDetections: detections.length,
    satisfied,
    neutral,
    unsatisfied,
    hourlyData: Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      ...data,
    })),
  });
}
