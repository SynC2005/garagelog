import Link from "next/link";
import { Wrench, Search, Clock, ShieldCheck, Camera, ArrowRight, UserCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100 flex flex-col justify-between">
      {/* Navbar Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Garage<span className="text-orange-500">Log</span>
              </span>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
                Bengkel Modifikasi Motor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/masuk"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
            >
              <UserCircle2 className="w-4 h-4" />
              <span>Masuk Staf</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Tracking Section */}
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Tracking Form (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pelacakan Publik Transparan & Tanpa Login</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Lacak progres motor <span className="text-orange-500">kesayangan Anda</span>
            </h1>

            <p className="text-slate-600 dark:text-zinc-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Masukkan kode pesanan dari nota atau pesan bengkel untuk memantau tahapan pengerjaan, foto perkembangan berkala, dan status kesiapan motor Anda.
            </p>

            {/* Tracking Input Box */}
            <form action="/lacak" method="GET" className="space-y-3 pt-2 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="kode"
                  required
                  placeholder="Contoh: PSN-9824-7123"
                  className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 shadow-sm transition-all text-base tracking-wide font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Lacak Pesanan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              * Privasi aman: Data pribadi dan rincian biaya tidak ditampilkan di halaman pelacakan publik.
            </p>
          </div>

          {/* Visual Workshop Highlights (Right Column) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800/80">
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Dokumentasi Foto Setiap Tahap
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Montir mendokumentasikan progres nyata dari bongkar bodi hingga uji coba
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-zinc-800/80">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Pembaruan Informasional
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Ketahui proses aktif seperti antre cat atau tunggu kedatangan suku cadang
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                    Estimasi & Riwayat Transparan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Pengerjaan terpantau teratur tanpa perlu bolak-balik menelpon bengkel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Steps Guide (Card Skeleton Sesuai Wireframe Page 15) */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            Cara Melacak Pesanan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold flex items-center justify-center text-sm mb-3">
                1
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                Ambil Kode Pesanan
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Kode pesanan unik tertera di lembar nota bengkel atau pesan konfirmasi yang Anda terima.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold flex items-center justify-center text-sm mb-3">
                2
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                Masukkan Kode
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Ketikkan kode pesanan pada kolom pencarian di atas, lalu tekan tombol <strong>Lacak Pesanan</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold flex items-center justify-center text-sm mb-3">
                3
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1">
                Pantau Progres
              </h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Lihat linimasa tahapan pengerjaan, catatan teknis montir, serta dokumentasi foto pengerjaan motor.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Sesuai Wireframe Page 15 */}
      <footer className="border-t border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div>
            <span className="font-semibold text-slate-700 dark:text-zinc-300">GarageLog</span> — Bengkel Modifikasi Motor &bull; Jalan Raya Otomotif No. 123 &bull; Telepon: 0812-3456-7890
          </div>
          <div>
            Jam Operasional: Senin – Sabtu, 08:30 – 17:30 WIB
          </div>
        </div>
      </footer>
    </div>
  );
}

