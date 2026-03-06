"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DetectionResult } from "@/types/detection";

interface SentimentChartProps {
  detections: DetectionResult[];
}

export default function SentimentChart({ detections }: SentimentChartProps) {
  // Group detections by hour
  const hourlyData: Record<
    string,
    { satisfied: number; neutral: number; unsatisfied: number }
  > = {};

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
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Sentimentos (Tempo Real)
        </h3>
        <p className="text-xs text-gray-500">Sem dados ainda</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">
        Sentimentos (Tempo Real)
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="time" stroke="#6b7280" fontSize={10} />
          <YAxis stroke="#6b7280" fontSize={10} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
          <Line
            type="monotone"
            dataKey="satisfied"
            stroke="#22c55e"
            name="Satisfeitos"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="neutral"
            stroke="#eab308"
            name="Neutros"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="unsatisfied"
            stroke="#ef4444"
            name="Insatisfeitos"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
