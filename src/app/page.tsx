import Link from "next/link";
import { Wrench, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LandingHero } from "@/components/landing/LandingHero";
import { OwnerAndFeedbackSection } from "@/components/landing/OwnerAndFeedbackSection";

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

      {/* Main Content */}
      <main className="w-full flex-1">
        {/* Hero Page dengan GridMotion */}
        <LandingHero />

        {/* 3 Steps Guide */}
        <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
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

        {/* Section Baru: FlipCard Pemilik & FolderFloat Komentar Pelanggan */}
        <OwnerAndFeedbackSection />
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
