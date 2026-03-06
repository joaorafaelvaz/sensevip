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
    {
      label: "Total",
      value: totalCustomers,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Satisfeitos",
      value: satisfied,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    {
      label: "Neutros",
      value: neutral,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
    },
    {
      label: "Insatisfeitos",
      value: unsatisfied,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-3 ${card.bg}`}
        >
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-400 mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
