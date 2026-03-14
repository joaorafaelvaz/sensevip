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
const CACHE_TTL_MS = 60_000; // Reload customer cache every 60s

// Track last detection time per customer to enforce cooldown
const lastDetectionTime = new Map<string, number>();

// Customer descriptor cache to avoid loading ALL customers from DB every detection
let customerCache: { id: string; descriptor: number[] }[] = [];
let cacheLastLoaded = 0;

async function getCustomerDescriptors() {
  const now = Date.now();
  if (now - cacheLastLoaded > CACHE_TTL_MS) {
    const customers = await prisma.customer.findMany({
      select: { id: true, faceDescriptor: true },
    });
    customerCache = customers.map((c) => ({
      id: c.id,
      descriptor: deserializeDescriptor(c.faceDescriptor),
    }));
    cacheLastLoaded = now;

    // Clean up expired cooldowns while we're here
    const entries = Array.from(lastDetectionTime.entries());
    for (const [id, time] of entries) {
      if (now - time > COOLDOWN_MS * 2) {
        lastDetectionTime.delete(id);
      }
    }
  }
  return customerCache;
}

function invalidateCustomerCache() {
  cacheLastLoaded = 0;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      descriptor,
      expression,
      satisfactionTag,
      confidence,
      rawExpressions,
      snapshotPath,
    } = body;

    if (!descriptor || !expression || !satisfactionTag) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const snapshot = snapshotPath || "no-snapshot";

    // Find matching customer (uses cached descriptors)
    const candidates = await getCustomerDescriptors();
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
          snapshotPath: snapshot,
        },
      });
      customerId = customer.id;
      isNew = true;
      lastDetectionTime.set(customerId, Date.now());
      invalidateCustomerCache();
    }

    // Create detection record
    const detection = await prisma.detection.create({
      data: {
        customerId,
        snapshotPath: snapshot,
        expression,
        satisfactionTag,
        confidence,
        rawExpressions: JSON.stringify(rawExpressions),
      },
    });

    return NextResponse.json({ detection, isNew, customerId });
  } catch (err) {
    console.error("POST /api/detections error:", err);
    return NextResponse.json(
      { error: "Erro interno ao salvar detecção" },
      { status: 500 }
    );
  }
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

  // Use aggregation for stats instead of loading all records
  const [counts, recentDetections] = await Promise.all([
    prisma.detection.groupBy({
      by: ["satisfactionTag"],
      where: { timestamp: { gte: startOfDay, lte: endOfDay } },
      _count: true,
      _avg: { confidence: true },
    }),
    prisma.detection.findMany({
      where: { timestamp: { gte: startOfDay, lte: endOfDay } },
      orderBy: { timestamp: "desc" },
      take: 20,
      select: {
        id: true,
        customerId: true,
        timestamp: true,
        snapshotPath: true,
        expression: true,
        satisfactionTag: true,
        confidence: true,
        rawExpressions: true,
      },
    }),
  ]);

  // Count unique customers from today
  const uniqueCount = await prisma.detection.findMany({
    where: { timestamp: { gte: startOfDay, lte: endOfDay } },
    distinct: ["customerId"],
    select: { customerId: true },
  });

  let satisfied = 0, neutral = 0, unsatisfied = 0, totalConf = 0, totalCount = 0;
  for (const g of counts) {
    const c = g._count;
    totalCount += c;
    totalConf += (g._avg.confidence || 0) * c;
    if (g.satisfactionTag === "SATISFIED") satisfied = c;
    else if (g.satisfactionTag === "NEUTRAL") neutral = c;
    else if (g.satisfactionTag === "UNSATISFIED") unsatisfied = c;
  }
  const avgConfidence = totalCount > 0 ? Math.round((totalConf / totalCount) * 100) / 100 : 0;

  return NextResponse.json({
    totalCustomers: uniqueCount.length,
    satisfied,
    neutral,
    unsatisfied,
    avgConfidence,
    recentDetections: recentDetections.map((d) => ({
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
