"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DetectionResult } from "@/types/detection";

interface SentimentChartProps {
  detections: DetectionResult[];
}

export default function SentimentChart({ detections }: SentimentChartProps) {
  const hourlyData: Record<string, { satisfied: number; neutral: number; unsatisfied: number }> = {};

  for (const d of detections) {
    const hour = new Date(d.timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (!hourlyData[hour]) {
      hourlyData[hour] = { satisfied: 0, neutral: 0, unsatisfied: 0 };
    }
    if (d.satisfactionTag === "SATISFIED") hourlyData[hour].satisfied++;
    else if (d.satisfactionTag === "NEUTRAL") hourlyData[hour].neutral++;
    else hourlyData[hour].unsatisfied++;
  }

  const chartData = Object.entries(hourlyData)
    .map(([time, data]) => ({ time, ...data }))
    .reverse();

  if (chartData.length === 0) {
    return (
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Sentimentos</h3>
        <p className="text-xs text-[var(--text-muted)]">Sem dados ainda</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Sentimentos</h3>
      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gSatisfied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gNeutral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gUnsatisfied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#3a3a42" fontSize={9} tickLine={false} axisLine={false} />
          <YAxis stroke="#3a3a42" fontSize={9} tickLine={false} axisLine={false} width={24} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface-overlay)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-primary)",
            }}
          />
          <Area type="monotone" dataKey="satisfied" stroke="#4ade80" strokeWidth={1.5} fill="url(#gSatisfied)" name="Satisfeitos" />
          <Area type="monotone" dataKey="neutral" stroke="#fbbf24" strokeWidth={1.5} fill="url(#gNeutral)" name="Neutros" />
          <Area type="monotone" dataKey="unsatisfied" stroke="#f87171" strokeWidth={1.5} fill="url(#gUnsatisfied)" name="Insatisfeitos" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
