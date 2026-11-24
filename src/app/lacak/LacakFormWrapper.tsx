"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wrench, Search, AlertCircle, ArrowRight, ShieldCheck, UserCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { trackOrderAction } from "@/server/api/lacak/lacakApi";

export function LacakFormWrapper() {
  const router = useRouter();
  const [kode, setKode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanCode = kode.trim().toUpperCase();

    if (!cleanCode) {
      setError("Masukkan kode pesanan terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    const res = await trackOrderAction(cleanCode);
    setIsLoading(false);

    if (res.success && res.data) {
      router.push(`/lacak/${cleanCode}`);
    } else {
      setError(res.error || "Kode tidak ditemukan. Periksa kembali kode pada nota atau pesan Anda.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Header Navbar Sesuai Wireframe Page 15 */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">
                Garage<span className="text-orange-500">Log</span>
              </span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium hidden sm:block">
                Bengkel Modifikasi Motor
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/masuk"
              className="text-xs font-semibold text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1.5"
            >
              <UserCircle2 className="w-4 h-4" />
              <span>Masuk Staf</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container Sesuai Wireframe Page 13 & 15 */}
      <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pelacakan Publik Transparan</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Lacak progres motor Anda
          </h1>

          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Masukkan kode pesanan dari nota atau pesan WhatsApp/SMS bengkel. Tidak perlu membuat akun
            atau login.
          </p>
        </div>

        {/* Input Card */}
        <div className="max-w-lg mx-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Kode Pesanan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  placeholder="PSN-XXXX-XXXX"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl text-base font-mono uppercase tracking-wider text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Error Message Box Sesuai Wireframe Page 13 */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-sm font-semibold"
            >
              <span>{isLoading ? "Mencari data pesanan..." : "Lacak Pesanan"}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <p className="text-[11px] text-slate-400 text-center pt-2">
            * Data nomor telepon dan rincian rupiah pembayaran dirahasiakan demi keamanan privasi Anda.
          </p>
        </div>

        {/* 3 Langkah Melacak Sesuai Wireframe Page 15 */}
        <div className="pt-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 text-center">
            Cara Melacak Pesanan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Ambil kode pesanan
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Kode tertera di lembar nota atau dikirimkan oleh staf bengkel.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Masukkan kode
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Ketik kode pada kolom di atas, lalu tekan tombol <strong>Lacak pesanan</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-orange-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Lihat progres
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Pantau tahap aktif, catatan montir, dan dokumentasi foto pengerjaan.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info Sesuai Wireframe Page 15 */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div>GarageLog Workshop &bull; Jalan Raya Otomotif No. 123 &bull; Telepon: 0812-3456-7890</div>
          <div>Jam buka: 08.30 – 17.30 WIB</div>
        </div>
      </footer>
    </div>
  );
}

