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
      <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Satisfacao</h3>
        <p className="text-xs text-gray-500">Sem dados ainda</p>
      </div>
    );
  }

  const pctSatisfied = Math.round((satisfied / total) * 100);
  const pctNeutral = Math.round((neutral / total) * 100);
  const pctUnsatisfied = Math.round((unsatisfied / total) * 100);

  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Satisfacao</h3>
      <div className="space-y-2">
        <BarRow label="Satisfeitos" pct={pctSatisfied} color="bg-green-500" />
        <BarRow label="Neutros" pct={pctNeutral} color="bg-yellow-500" />
        <BarRow label="Insatisfeitos" pct={pctUnsatisfied} color="bg-red-500" />
      </div>
    </div>
  );
}

function BarRow({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
