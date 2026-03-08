"use client";

interface StatsCardsProps {
  totalCustomers: number;
  satisfied: number;
  neutral: number;
  unsatisfied: number;
}

export default function StatsCards({
  totalCustomers,
  satisfied,
  neutral,
  unsatisfied,
}: StatsCardsProps) {
  const cards = [
    { label: "Clientes", value: totalCustomers, accent: "text-[var(--gold)]", dot: "bg-[var(--gold)]" },
    { label: "Satisfeitos", value: satisfied, accent: "text-emerald-400", dot: "bg-emerald-400" },
    { label: "Neutros", value: neutral, accent: "text-amber-400", dot: "bg-amber-400" },
    { label: "Insatisfeitos", value: unsatisfied, accent: "text-red-400", dot: "bg-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 stagger">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3.5 transition-colors hover:border-[var(--border)]/80"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${card.dot} opacity-60`} />
            <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest">{card.label}</span>
          </div>
          <p className={`text-2xl font-semibold font-mono tracking-tight ${card.accent}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
