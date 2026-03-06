"use client";

import {
  getSatisfactionEmoji,
  getSatisfactionColor,
} from "@/lib/satisfaction-mapper";
import type { DetectionResult } from "@/types/detection";

interface RecentDetectionsProps {
  detections: DetectionResult[];
}

export default function RecentDetections({
  detections,
}: RecentDetectionsProps) {
  if (detections.length === 0) {
    return (
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">
          Ultimas Deteccoes
        </h3>
        <p className="text-xs text-gray-500">Nenhuma deteccao ainda</p>
      </div>
    );
  }

  const satisfactionLabel: Record<string, string> = {
    SATISFIED: "Satisfeito",
    NEUTRAL: "Neutro",
    UNSATISFIED: "Insatisfeito",
  };

  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">
        Ultimas Deteccoes
      </h3>
      <div className="space-y-2 max-h-[240px] overflow-y-auto">
        {detections.slice(0, 10).map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between py-1.5 border-b border-gray-700 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getSatisfactionEmoji(d.satisfactionTag)}
              </span>
              <span
                className={`text-sm font-medium ${getSatisfactionColor(
                  d.satisfactionTag
                )}`}
              >
                {satisfactionLabel[d.satisfactionTag] || d.satisfactionTag}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{Math.round(d.confidence * 100)}%</span>
              <span>
                {new Date(d.timestamp).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
