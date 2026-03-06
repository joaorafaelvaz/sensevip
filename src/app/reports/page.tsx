"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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
  const [date, setDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/daily?date=${date}`);
        if (res.ok) {
          setReport(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [date]);

  const total = report
    ? report.satisfied + report.neutral + report.unsatisfied
    : 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">Relatorios</h1>
        <button
          onClick={() => router.push("/monitor")}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Voltar ao Monitor
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-400">Data:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <p className="text-gray-500 text-center py-12">Carregando...</p>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <SummaryCard
                label="Total Clientes"
                value={report.totalCustomers}
                color="text-blue-400"
              />
              <SummaryCard
                label="Satisfeitos"
                value={report.satisfied}
                sub={total > 0 ? `${Math.round((report.satisfied / total) * 100)}%` : ""}
                color="text-green-400"
              />
              <SummaryCard
                label="Neutros"
                value={report.neutral}
                sub={total > 0 ? `${Math.round((report.neutral / total) * 100)}%` : ""}
                color="text-yellow-400"
              />
              <SummaryCard
                label="Insatisfeitos"
                value={report.unsatisfied}
                sub={total > 0 ? `${Math.round((report.unsatisfied / total) * 100)}%` : ""}
                color="text-red-400"
              />
            </div>

            {/* Hourly Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-300 mb-4">
                Deteccoes por Hora
              </h3>
              {report.hourlyData.some((h) => h.total > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={report.hourlyData.filter((h) => h.total > 0)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="hour"
                      stroke="#6b7280"
                      fontSize={11}
                      tickFormatter={(h) => `${h}h`}
                    />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Bar
                      dataKey="satisfied"
                      stackId="a"
                      fill="#22c55e"
                      name="Satisfeitos"
                    />
                    <Bar
                      dataKey="neutral"
                      stackId="a"
                      fill="#eab308"
                      name="Neutros"
                    />
                    <Bar
                      dataKey="unsatisfied"
                      stackId="a"
                      fill="#ef4444"
                      name="Insatisfeitos"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  Sem dados para este dia
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-12">
            Selecione uma data para gerar o relatorio
          </p>
        )}
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}
