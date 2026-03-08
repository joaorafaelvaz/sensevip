"use client";

import {
  getSatisfactionEmoji,
  getSatisfactionColor,
} from "@/lib/satisfaction-mapper";
import type { DetectionResult } from "@/types/detection";

interface RecentDetectionsProps {
  detections: DetectionResult[];
}

const satisfactionLabel: Record<string, string> = {
  SATISFIED: "Satisfeito",
  NEUTRAL: "Neutro",
  UNSATISFIED: "Insatisfeito",
};

export default function RecentDetections({ detections }: RecentDetectionsProps) {
  if (detections.length === 0) {
    return (
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Ultimas Deteccoes</h3>
        <p className="text-xs text-[var(--text-muted)]">Nenhuma deteccao ainda</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Ultimas Deteccoes</h3>
      <div className="space-y-1 max-h-[220px] overflow-y-auto stagger">
        {detections.slice(0, 10).map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-[var(--surface-overlay)] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{getSatisfactionEmoji(d.satisfactionTag)}</span>
              <span className={`text-xs font-medium ${getSatisfactionColor(d.satisfactionTag)}`}>
                {satisfactionLabel[d.satisfactionTag] || d.satisfactionTag}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
              <span>{Math.round(d.confidence * 100)}%</span>
              <span className="text-[var(--text-muted)]/60">
                {new Date(d.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
