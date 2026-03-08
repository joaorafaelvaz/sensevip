"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HourlyData {
  hour: number;
  satisfied: number;
  neutral: number;
  unsatisfied: number;
  total: number;
}

interface ReportData {
  date: string;
  totalCustomers: number;
  totalDetections: number;
  satisfied: number;
  neutral: number;
  unsatisfied: number;
  hourlyData: HourlyData[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/daily?date=${date}`);
        if (res.ok) setReport(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [date]);

  const total = report ? report.satisfied + report.neutral + report.unsatisfied : 0;

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="flex items-center justify-between px-6 py-3 bg-[var(--surface-raised)] border-b border-[var(--border)]">
        <h1 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Relatorios</h1>
        <button
          onClick={() => router.push("/monitor")}
          className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          Voltar ao Monitor
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Date picker */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--gold-dim)] transition-colors"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl" />)}
            </div>
            <div className="h-[300px] skeleton rounded-xl" />
          </div>
        ) : report ? (
          <div className="space-y-5 animate-fade-up">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-3 stagger">
              <SummaryCard label="Total Clientes" value={report.totalCustomers} accent="text-[var(--gold)]" />
              <SummaryCard
                label="Satisfeitos"
                value={report.satisfied}
                sub={total > 0 ? `${Math.round((report.satisfied / total) * 100)}%` : ""}
                accent="text-emerald-400"
              />
              <SummaryCard
                label="Neutros"
                value={report.neutral}
                sub={total > 0 ? `${Math.round((report.neutral / total) * 100)}%` : ""}
                accent="text-amber-400"
              />
              <SummaryCard
                label="Insatisfeitos"
                value={report.unsatisfied}
                sub={total > 0 ? `${Math.round((report.unsatisfied / total) * 100)}%` : ""}
                accent="text-red-400"
              />
            </div>

            {/* Chart */}
            <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-6">
              <h3 className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mb-5">
                Deteccoes por Hora
              </h3>
              {report.hourlyData.some((h) => h.total > 0) ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={report.hourlyData.filter((h) => h.total > 0)}>
                    <XAxis dataKey="hour" stroke="#3a3a42" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(h) => `${h}h`} />
                    <YAxis stroke="#3a3a42" fontSize={10} tickLine={false} axisLine={false} width={28} />
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
                    <Bar dataKey="satisfied" stackId="a" fill="#4ade80" radius={[0, 0, 0, 0]} name="Satisfeitos" />
                    <Bar dataKey="neutral" stackId="a" fill="#fbbf24" name="Neutros" />
                    <Bar dataKey="unsatisfied" stackId="a" fill="#f87171" radius={[3, 3, 0, 0]} name="Insatisfeitos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-[var(--text-muted)] text-sm text-center py-12">Sem dados para este dia</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-20">Selecione uma data para gerar o relatorio</p>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent: string }) {
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4">
      <p className={`text-2xl font-semibold font-mono tracking-tight ${accent}`}>{value}</p>
      <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-widest mt-1.5">{label}</p>
      {sub && <p className="text-[11px] font-mono text-[var(--text-muted)]/60 mt-0.5">{sub}</p>}
    </div>
  );
}
