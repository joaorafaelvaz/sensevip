import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  deserializeDescriptor,
  findBestMatch,
} from "@/lib/descriptor-utils";

const FACE_MATCH_THRESHOLD = parseFloat(
  process.env.FACE_MATCH_THRESHOLD || "0.45"
);
const COOLDOWN_MS = parseInt(process.env.CUSTOMER_COOLDOWN_MS || "60000", 10);

// Track last detection time per customer to enforce cooldown
const lastDetectionTime = new Map<string, number>();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    descriptor,
    expression,
    satisfactionTag,
    confidence,
    rawExpressions,
    snapshotPath,
  } = body;

  if (!descriptor || !expression || !satisfactionTag || !snapshotPath) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  // Find matching customer
  const customers = await prisma.customer.findMany({
    select: { id: true, faceDescriptor: true },
  });

  const candidates = customers.map((c) => ({
    id: c.id,
    descriptor: deserializeDescriptor(c.faceDescriptor),
  }));

  const match = findBestMatch(descriptor, candidates, FACE_MATCH_THRESHOLD);

  let customerId: string;
  let isNew = false;

  if (match) {
    // Check cooldown
    const lastTime = lastDetectionTime.get(match.id);
    if (lastTime && Date.now() - lastTime < COOLDOWN_MS) {
      return NextResponse.json({
        skipped: true,
        reason: "cooldown",
        customerId: match.id,
      });
    }

    customerId = match.id;
    await prisma.customer.update({
      where: { id: customerId },
      data: { visitCount: { increment: 1 } },
    });
    lastDetectionTime.set(customerId, Date.now());
  } else {
    // New customer
    const customer = await prisma.customer.create({
      data: {
        faceDescriptor: JSON.stringify(descriptor),
        snapshotPath,
      },
    });
    customerId = customer.id;
    isNew = true;
    lastDetectionTime.set(customerId, Date.now());
  }

  // Create detection record
  const detection = await prisma.detection.create({
    data: {
      customerId,
      snapshotPath,
      expression,
      satisfactionTag,
      confidence,
      rawExpressions: JSON.stringify(rawExpressions),
    },
  });

  return NextResponse.json({ detection, isNew, customerId });
}

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
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  const uniqueCustomers = new Set(detections.map((d) => d.customerId));
  const satisfied = detections.filter(
    (d) => d.satisfactionTag === "SATISFIED"
  ).length;
  const neutral = detections.filter(
    (d) => d.satisfactionTag === "NEUTRAL"
  ).length;
  const unsatisfied = detections.filter(
    (d) => d.satisfactionTag === "UNSATISFIED"
  ).length;
  const avgConfidence =
    detections.length > 0
      ? detections.reduce((sum, d) => sum + d.confidence, 0) /
        detections.length
      : 0;

  return NextResponse.json({
    totalCustomers: uniqueCustomers.size,
    satisfied,
    neutral,
    unsatisfied,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    recentDetections: detections.slice(0, 20).map((d) => ({
      id: d.id,
      customerId: d.customerId,
      timestamp: d.timestamp.toISOString(),
      snapshotPath: d.snapshotPath,
      expression: d.expression,
      satisfactionTag: d.satisfactionTag,
      confidence: d.confidence,
      rawExpressions: JSON.parse(d.rawExpressions),
    })),
  });
}
