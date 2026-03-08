"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao fazer login");
        return;
      }

      router.push("/monitor");
    } catch {
      setError("Erro de conexao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface)] relative overflow-hidden">
      {/* Decorative ambient light */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[var(--gold)]/[0.03] blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[var(--gold)]/[0.02] blur-[100px]" />

      <div className="relative w-full max-w-[380px] px-6 animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 mb-5">
            <svg className="w-7 h-7 text-[var(--gold)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">SatisfyCAM</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 tracking-wide">Barbearia VIP Santa Monica</p>
        </div>

        {/* Form card */}
        <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-2xl p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-widest">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dim)] transition-colors"
                placeholder="admin@satisfycam.com"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-2 uppercase tracking-widest">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-dim)] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/10 rounded-xl p-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--gold)] hover:bg-[var(--gold-light)] disabled:opacity-50 text-[var(--surface)] text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(201,168,76,0.25)]"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
