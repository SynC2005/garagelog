import Link from "next/link";
import {
  Wrench,
  Search,
  Clock,
  ShieldCheck,
  Camera,
  ArrowRight,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between">
      {/* Navbar Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Wrench className="size-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-foreground">
                Garage<span className="text-primary">Log</span>
              </span>
              <p className="text-xs text-muted-foreground font-medium hidden sm:block">
                Bengkel Modifikasi Motor
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/masuk">
                <UserCircle2 className="size-4" aria-hidden="true" />
                <span>Masuk Staf</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Hero & Tracking Section */}
      <main className="max-w-6xl mx-auto px-4 py-12 md:py-16 w-full flex-1 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Tracking Form (Left Column) */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="info" className="gap-1.5 py-1 px-3">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Pelacakan Publik Transparan &amp; Tanpa Login</span>
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Lacak progres motor <span className="text-primary">kesayangan Anda</span>
            </h1>

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-prose">
              Masukkan kode pesanan dari nota atau pesan bengkel untuk memantau tahapan pengerjaan,
              foto perkembangan berkala, dan status kesiapan motor Anda.
            </p>

            {/* Tracking Input Box */}
            <form action="/lacak" method="GET" className="space-y-3 pt-2 max-w-lg">
              <div className="relative">
                <Search
                  className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  name="kode"
                  required
                  aria-label="Kode Pesanan"
                  placeholder="Contoh: PSN-9824-7123"
                  className="h-12 pl-10 pr-4 font-mono text-base uppercase tracking-wider bg-card"
                />
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto px-7">
                <span>Lacak Pesanan</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground">
              * Privasi aman: Data pribadi dan rincian biaya tidak ditampilkan di halaman pelacakan publik.
            </p>
          </div>

          {/* Visual Workshop Highlights (Right Column) */}
          <div className="lg:col-span-5">
            <Card className="py-0 gap-0">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Camera className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-sm">
                      Dokumentasi Foto Setiap Tahap
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Montir mendokumentasikan progres nyata dari bongkar bodi hingga uji coba.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Clock className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-sm">
                      Pembaruan Informasional
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Ketahui proses aktif seperti antre cat atau tunggu kedatangan suku cadang.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3.5">
                  <div className="size-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-sm">
                      Estimasi &amp; Riwayat Transparan
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Pengerjaan terpantau teratur tanpa perlu bolak-balik menghubungi bengkel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <section className="pt-12 border-t border-border">
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-6">
            Cara Melacak Pesanan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="py-0 gap-0">
              <CardContent className="p-5 space-y-2.5">
                <div className="size-8 rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm tabular-nums">
                  1
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  Ambil Kode Pesanan
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Kode pesanan unik tertera di lembar nota bengkel atau pesan konfirmasi yang Anda terima.
                </p>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-5 space-y-2.5">
                <div className="size-8 rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm tabular-nums">
                  2
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  Masukkan Kode
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ketikkan kode pesanan pada kolom pencarian di atas, lalu tekan tombol{" "}
                  <strong className="text-foreground">Lacak Pesanan</strong>.
                </p>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-5 space-y-2.5">
                <div className="size-8 rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm tabular-nums">
                  3
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  Pantau Progres
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lihat linimasa tahapan pengerjaan, catatan teknis montir, serta dokumentasi foto motor.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">GarageLog</span> &mdash; Bengkel Modifikasi Motor &bull; Jalan Raya Otomotif No. 123 &bull; Telepon: 0812-3456-7890
          </div>
          <div>Jam Operasional: Senin &ndash; Sabtu, 08:30 &ndash; 17:30 WIB</div>
        </div>
      </footer>
    </div>
  );
}
