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
  const { stats, isConnected } = useLiveStats();
  const [currentTime, setCurrentTime] = useState("");
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
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">SatisfyCAM</h1>
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>Loja: {storeName}</span>
          <span>{currentTime}</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Camera Panel */}
        <div className="flex-1 p-6 flex flex-col">
          <CameraFeed />
        </div>

        {/* Dashboard Sidebar */}
        <aside className="w-[380px] border-l border-gray-800 bg-gray-900/50 p-4 overflow-y-auto flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
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

      {/* Footer Navigation */}
      <footer className="flex items-center gap-2 px-6 py-2 bg-gray-900 border-t border-gray-800">
        <NavButton
          label="Relatorios"
          onClick={() => router.push("/reports")}
        />
        <NavButton
          label="Base de Clientes"
          onClick={() => router.push("/customers")}
        />
        <div className="flex-1" />
        <NavButton label="Sair" onClick={() => router.push("/login")} />
      </footer>
    </div>
  );
}

function NavButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
    >
      {label}
    </button>
  );
}
