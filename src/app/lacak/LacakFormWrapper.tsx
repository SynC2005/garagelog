"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Search,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
      setError(
        res.error ||
          "Kode tidak ditemukan. Periksa kembali kode pada nota atau pesan Anda."
      );
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between">
      {/* Header Navbar */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Wrench className="size-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">
                Garage<span className="text-primary">Log</span>
              </span>
              <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
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

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-12 w-full flex-1 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <Badge variant="info" className="gap-1.5 py-1 px-3 mx-auto">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            <span>Pelacakan Publik Transparan</span>
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Lacak progres motor Anda
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Masukkan kode pesanan dari nota atau pesan WhatsApp/SMS bengkel. Tidak
            perlu membuat akun atau login.
          </p>
        </div>

        {/* Input Card */}
        <Card className="max-w-lg mx-auto py-0 gap-0">
          <CardContent className="p-6 sm:p-8 space-y-4">
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="track-kode" className="text-xs font-semibold">
                  Kode Pesanan
                </Label>
                <div className="relative">
                  <Search
                    className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    id="track-kode"
                    type="text"
                    required
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    placeholder="PSN-XXXX-XXXX"
                    className="h-12 pl-10 pr-4 text-base font-mono uppercase tracking-wider"
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="w-full font-semibold"
              >
                <span>{isLoading ? "Mencari data pesanan..." : "Lacak Pesanan"}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center pt-1">
              * Data nomor telepon dan rincian rupiah pembayaran dirahasiakan demi
              keamanan privasi Anda.
            </p>
          </CardContent>
        </Card>

        {/* 3 Langkah Melacak */}
        <section className="pt-4">
          <h2 className="text-base font-bold text-foreground mb-4 text-center">
            Cara Melacak Pesanan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="py-0 gap-0">
              <CardContent className="p-4 space-y-2">
                <div className="size-7 rounded-md bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center tabular-nums">
                  1
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                  Ambil kode pesanan
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Kode tertera di lembar nota atau dikirimkan oleh staf bengkel.
                </p>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-4 space-y-2">
                <div className="size-7 rounded-md bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center tabular-nums">
                  2
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                  Masukkan kode
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ketik kode pada kolom di atas, lalu tekan tombol{" "}
                  <strong className="text-foreground">Lacak Pesanan</strong>.
                </p>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-4 space-y-2">
                <div className="size-7 rounded-md bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center tabular-nums">
                  3
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                  Lihat progres
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pantau tahap aktif, catatan montir, dan dokumentasi foto pengerjaan.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-border bg-card py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            GarageLog Workshop &bull; Jalan Raya Otomotif No. 123 &bull; Telepon:
            0812-3456-7890
          </div>
          <div>Jam buka: 08.30 &ndash; 17.30 WIB</div>
        </div>
      </footer>
    </div>
  );
}
