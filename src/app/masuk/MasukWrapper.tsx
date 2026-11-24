"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { loginStaffAction } from "@/server/api/auth/authApi";

export function MasukWrapper() {
  const router = useRouter();
  const [email, setEmail] = React.useState("admin@garagelog.com");
  const [password, setPassword] = React.useState("bengkel123");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await loginStaffAction({
      email,
      kataSandi: password,
    });

    setIsLoading(false);

    if (res.success && res.data) {
      // Simpan session info di sessionStorage
      sessionStorage.setItem("active_user", JSON.stringify(res.data));
      if (res.data.peran === "Montir") {
        router.push("/tugas");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(res.error || "Email atau kata sandi tidak valid.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between p-4">
      <div className="flex justify-end p-2">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          {/* Logo Bengkel */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Masuk Staf
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Khusus admin, montir, dan pemilik usaha bengkel.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@garagelog.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Kata sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 text-sm font-semibold mt-2"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          {/* Akses Cepat Akun Demo */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 text-center">
              Pilih Akun Cepat (Demo):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail("budi.montir@garagelog.com");
                  setPassword("bengkel123");
                  setError(null);
                }}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center ${
                  email === "budi.montir@garagelog.com"
                    ? "bg-orange-50 border-orange-500 text-orange-600 dark:bg-orange-950/40 dark:border-orange-500 dark:text-orange-400"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                🔧 Montir
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@garagelog.com");
                  setPassword("bengkel123");
                  setError(null);
                }}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center ${
                  email === "admin@garagelog.com"
                    ? "bg-orange-50 border-orange-500 text-orange-600 dark:bg-orange-950/40 dark:border-orange-500 dark:text-orange-400"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                💼 Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail("owner@garagelog.com");
                  setPassword("bengkel123");
                  setError(null);
                }}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-all text-center ${
                  email === "owner@garagelog.com"
                    ? "bg-orange-50 border-orange-500 text-orange-600 dark:bg-orange-950/40 dark:border-orange-500 dark:text-orange-400"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                👑 Pemilik
              </button>
            </div>
          </div>

          {/* Link ke pelacakan */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800 text-center">
            <Link
              href="/lacak"
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium transition-colors"
            >
              <span>Pelanggan? Lacak pesanan dengan kode</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="text-center py-4 text-xs text-slate-400 dark:text-zinc-600">
        &copy; {new Date().getFullYear()} GarageLog. Seluruh hak cipta dilindungi.
      </div>
    </div>
  );
}
