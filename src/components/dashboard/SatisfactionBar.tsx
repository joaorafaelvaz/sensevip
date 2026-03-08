"use client";

interface SatisfactionBarProps {
  satisfied: number;
  neutral: number;
  unsatisfied: number;
}

export default function SatisfactionBar({
  satisfied,
  neutral,
  unsatisfied,
}: SatisfactionBarProps) {
  const total = satisfied + neutral + unsatisfied;

  if (total === 0) {
    return (
      <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
        <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-3">Satisfacao</h3>
        <p className="text-xs text-[var(--text-muted)]">Sem dados ainda</p>
      </div>
    );
  }

  const pctSatisfied = Math.round((satisfied / total) * 100);
  const pctNeutral = Math.round((neutral / total) * 100);
  const pctUnsatisfied = Math.round((unsatisfied / total) * 100);

  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-4">Satisfacao</h3>

      {/* Combined bar */}
      <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden flex mb-4">
        {pctSatisfied > 0 && (
          <div className="h-full bg-emerald-400 transition-all duration-700 first:rounded-l-full last:rounded-r-full" style={{ width: `${pctSatisfied}%` }} />
        )}
        {pctNeutral > 0 && (
          <div className="h-full bg-amber-400 transition-all duration-700 first:rounded-l-full last:rounded-r-full" style={{ width: `${pctNeutral}%` }} />
        )}
        {pctUnsatisfied > 0 && (
          <div className="h-full bg-red-400 transition-all duration-700 first:rounded-l-full last:rounded-r-full" style={{ width: `${pctUnsatisfied}%` }} />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <Legend pct={pctSatisfied} color="bg-emerald-400" />
        <Legend pct={pctNeutral} color="bg-amber-400" />
        <Legend pct={pctUnsatisfied} color="bg-red-400" />
      </div>
    </div>
  );
}

function Legend({ pct, color }: { pct: number; color: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
      <span className={`w-2 h-2 rounded-sm ${color}`} />
      <span className="font-mono text-[11px]">{pct}%</span>
    </span>
  );
}
