"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getSatisfactionEmoji,
  getSatisfactionColor,
} from "@/lib/satisfaction-mapper";

interface CustomerItem {
  id: string;
  snapshotPath: string;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  totalDetections: number;
  lastDetection: {
    satisfactionTag: string;
    expression: string;
    confidence: number;
    timestamp: string;
  } | null;
}

const satisfactionLabel: Record<string, string> = {
  SATISFIED: "Satisfeito",
  NEUTRAL: "Neutro",
  UNSATISFIED: "Insatisfeito",
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?page=${page}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers);
          setTotalPages(data.pagination.totalPages);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [page]);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="flex items-center justify-between px-6 py-3 bg-[var(--surface-raised)] border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">Base de Clientes</h1>
          {!loading && (
            <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--surface-overlay)] px-2 py-0.5 rounded-full">
              {customers.length > 0 ? `${customers.length} registros` : "vazio"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={isClearing || customers.length === 0}
            onClick={async () => {
              if (!confirm("Tem certeza que deseja excluir TODOS os clientes e deteccoes? Esta acao nao pode ser desfeita.")) return;
              setIsClearing(true);
              try {
                const res = await fetch("/api/customers", { method: "DELETE" });
                if (res.ok) {
                  setCustomers([]);
                  setPage(1);
                  setTotalPages(1);
                } else {
                  alert("Erro ao limpar base");
                }
              } catch {
                alert("Erro de conexao");
              }
              setIsClearing(false);
            }}
            className="px-3 py-1.5 text-[11px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 border border-red-500/15 rounded-lg transition-colors disabled:opacity-30"
          >
            {isClearing ? "Limpando..." : "Resetar Base"}
          </button>
          <button
            onClick={() => router.push("/monitor")}
            className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Voltar ao Monitor
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 skeleton rounded-xl" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border)] mb-4">
              <svg className="w-7 h-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--text-muted)]">Nenhum cliente registrado ainda</p>
          </div>
        ) : (
          <div className="space-y-2 stagger">
            {customers.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--border)]/80 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-[var(--surface-overlay)] overflow-hidden flex-shrink-0 border border-[var(--border)]">
                  {c.snapshotPath && c.snapshotPath !== "no-snapshot" && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.snapshotPath} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Cliente #{c.id.slice(-4).toUpperCase()}
                  </p>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                    {c.visitCount} visita{c.visitCount !== 1 ? "s" : ""} &middot; {new Date(c.lastSeenAt).toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {c.lastDetection && (
                    <span className={`text-xs font-medium ${getSatisfactionColor(c.lastDetection.satisfactionTag)}`}>
                      {getSatisfactionEmoji(c.lastDetection.satisfactionTag)}{" "}
                      {satisfactionLabel[c.lastDetection.satisfactionTag]}
                    </span>
                  )}
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                    {c.totalDetections} deteccao{c.totalDetections !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-[11px] font-medium bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg disabled:opacity-30 hover:border-[var(--gold-dim)] transition-colors"
            >
              Anterior
            </button>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-[11px] font-medium bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] rounded-lg disabled:opacity-30 hover:border-[var(--gold-dim)] transition-colors"
            >
              Proxima
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
