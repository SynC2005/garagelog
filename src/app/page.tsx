import Link from "next/link";
import { UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/ui/BrandMark";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LandingHero } from "@/components/landing/LandingHero";
import { OwnerAndFeedbackSection } from "@/components/landing/OwnerAndFeedbackSection";
import { getPublicLandingContent } from "@/server/services/pengaturan/landingService";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { settings, visibleReviews } = await getPublicLandingContent();

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between">
      {/* Navbar Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="min-w-0">
            <BrandMark size="md" />
          </Link>

          <div className="flex items-center gap-2.5 shrink-0">
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
        {/* Hero Page dengan GridMotion atau Foto Background Kustom */}
        <LandingHero heroBgUrl={settings.heroBgUrl} />

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
                  Kode pesanan unik tertera di lembar nota bengkel atau pesan
                  konfirmasi yang Anda terima.
                </p>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-5 space-y-2.5">
                <div className="size-8 rounded-md bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm tabular-nums">
                  2
                </div>
                <h3 className="font-semibold text-foreground text-base">
                  Buka Halaman Lacak
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tekan tombol{" "}
                  <strong className="text-foreground">Lacak Pesanan</strong> di
                  atas, lalu masukkan kode pesanan Anda pada halaman pelacakan.
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
                  Lihat linimasa tahapan pengerjaan, catatan teknis montir,
                  serta dokumentasi foto motor.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section FlipCard Pemilik & FolderFloat Komentar Pelanggan */}
        <OwnerAndFeedbackSection settings={settings} reviews={visibleReviews} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground">
              {settings.namaPerusahaan}
            </span>{" "}
            &mdash; {settings.taglinePerusahaan} &bull; Jalan Raya Otomotif No.
            123 &bull; Telepon: 0812-3456-7890
          </div>
          <div>Jam Operasional: Senin &ndash; Sabtu, 08:30 &ndash; 17:30 WIB</div>
        </div>
      </footer>
    </div>
  );
}
