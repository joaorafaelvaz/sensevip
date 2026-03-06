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

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

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

  const satisfactionLabel: Record<string, string> = {
    SATISFIED: "Satisfeito",
    NEUTRAL: "Neutro",
    UNSATISFIED: "Insatisfeito",
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <h1 className="text-lg font-bold text-white">Base de Clientes</h1>
        <button
          onClick={() => router.push("/monitor")}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Voltar ao Monitor
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {loading ? (
          <p className="text-gray-500 text-center py-12">Carregando...</p>
        ) : customers.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            Nenhum cliente registrado ainda
          </p>
        ) : (
          <div className="space-y-3">
            {customers.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-lg p-4"
              >
                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                  {c.snapshotPath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.snapshotPath}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    Cliente #{c.id.slice(-4).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ultima visita:{" "}
                    {new Date(c.lastSeenAt).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Total de visitas: {c.visitCount}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {c.lastDetection && (
                    <span
                      className={`text-sm font-medium ${getSatisfactionColor(
                        c.lastDetection.satisfactionTag
                      )}`}
                    >
                      {getSatisfactionEmoji(c.lastDetection.satisfactionTag)}{" "}
                      {satisfactionLabel[c.lastDetection.satisfactionTag]}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {c.totalDetections} deteccoes
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              Pagina {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50"
            >
              Proxima
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
