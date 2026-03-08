"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CameraFeed from "@/components/camera/CameraFeed";
import StatsCards from "@/components/dashboard/StatsCards";
import SatisfactionBar from "@/components/dashboard/SatisfactionBar";
import SentimentChart from "@/components/dashboard/SentimentChart";
import RecentDetections from "@/components/dashboard/RecentDetections";
import { useLiveStats } from "@/hooks/useLiveStats";

export default function MonitorPage() {
  const router = useRouter();
  const { stats, isConnected, refresh } = useLiveStats();
  const [currentTime, setCurrentTime] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "SatisfyCAM";

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[var(--surface)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-[var(--surface-raised)] border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[var(--gold)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">SatisfyCAM</h1>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
        </div>

        <div className="flex items-center gap-5 text-[11px] font-mono text-[var(--text-muted)]">
          <span>{storeName}</span>
          <span className="text-[var(--text-muted)]/60">{currentTime}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Camera Panel */}
        <div className="flex-1 p-5 flex flex-col">
          <CameraFeed />
        </div>

        {/* Dashboard Sidebar */}
        <aside className="w-[360px] border-l border-[var(--border)] bg-[var(--surface-raised)]/30 p-4 overflow-y-auto flex flex-col gap-3">
          <h2 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">
            Dashboard do Dia
          </h2>

          <StatsCards
            totalCustomers={stats.totalCustomers}
            satisfied={stats.satisfied}
            neutral={stats.neutral}
            unsatisfied={stats.unsatisfied}
          />

          <SatisfactionBar
            satisfied={stats.satisfied}
            neutral={stats.neutral}
            unsatisfied={stats.unsatisfied}
          />

          <SentimentChart detections={stats.recentDetections} />

          <RecentDetections detections={stats.recentDetections} />
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex items-center gap-1 px-5 py-2 bg-[var(--surface-raised)] border-t border-[var(--border)]">
        <NavButton label="Relatorios" onClick={() => router.push("/reports")} />
        <NavButton label="Clientes" onClick={() => router.push("/customers")} />
        <div className="flex-1" />
        <button
          disabled={isClearing}
          onClick={async () => {
            if (!confirm("Tem certeza que deseja excluir TODOS os clientes e deteccoes? Esta acao nao pode ser desfeita.")) return;
            setIsClearing(true);
            try {
              const res = await fetch("/api/customers", { method: "DELETE" });
              if (res.ok) refresh();
              else alert("Erro ao limpar base de clientes");
            } catch {
              alert("Erro de conexao");
            }
            setIsClearing(false);
          }}
          className="px-3 py-1.5 text-[11px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
        >
          {isClearing ? "Limpando..." : "Limpar Base"}
        </button>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <NavButton label="Sair" onClick={() => router.push("/login")} />
      </footer>
    </div>
  );
}

function NavButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] rounded-lg transition-colors"
    >
      {label}
    </button>
  );
}
