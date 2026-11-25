"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Search,
  Clock,
  ShieldCheck,
  Camera,
  ArrowRight,
  Wrench,
} from "lucide-react";
import { GridMotion, type GridMotionItem } from "@/components/ui/GridMotion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const HERO_WORKSHOP_ITEMS: GridMotionItem[] = [
  {
    src: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=640&q=75&auto=format&fit=crop",
    alt: "",
  },
  <div
    key="stage-1"
    className="flex flex-col items-start justify-between w-full h-full p-4 text-left"
  >
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-primary">
      <Wrench className="size-3.5" aria-hidden="true" />
      Tahap 01
    </span>
    <div>
      <p className="font-bold text-sm text-foreground">Kustom Rangka &amp; Tangki</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        Dokumentasi foto wajib
      </p>
    </div>
  </div>,
  {
    src: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=640&q=75&auto=format&fit=crop",
    alt: "",
  },
  <div
    key="order-code"
    className="flex flex-col items-start justify-between w-full h-full p-4 text-left"
  >
    <span className="text-[11px] font-semibold text-muted-foreground">
      Kode Pelacakan
    </span>
    <span className="font-mono font-black text-base text-primary tracking-wider">
      PSN-9824-7123
    </span>
  </div>,
  {
    src: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=640&q=75&auto=format&fit=crop",
    alt: "",
  },
  <div
    key="stage-2"
    className="flex flex-col items-start justify-between w-full h-full p-4 text-left"
  >
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
      <Camera className="size-3.5" aria-hidden="true" />
      Pengecatan Oven
    </span>
    <p className="text-xs font-medium text-muted-foreground">
      Epoxy primer hingga finishing clear coat
    </p>
  </div>,
  {
    src: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=640&q=75&auto=format&fit=crop",
    alt: "",
  },
  "Uji Kelistrikan & Jalan",
];

const emptySubscribe = () => () => {};

export function LandingHero() {
  const { resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <section
      aria-label="Pelacakan progres modifikasi motor"
      className="relative overflow-hidden border-b border-border bg-background"
    >
      {/* Lapisan Latar GridMotion Interaktif */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <GridMotion
          items={HERO_WORKSHOP_ITEMS}
          rows={4}
          aspectRatio={1.33}
          gap={16}
          radius={14}
          angle={-12}
          tilt={8}
          speed={22}
          direction="alternate"
          parallax={0.5}
          spotlight={0.65}
          dim={isDark ? 0.55 : 0.45}
          fade={0.65}
          grayscale={false}
          theme={isDark ? "dark" : "light"}
          tileColor={isDark ? "#18181b" : "#f1f5f9"}
          textColor={isDark ? "#e4e4e7" : "#1e293b"}
        />
      </div>

      {/* Scrim Kontras agar Tipografi dan Form Tetap Tajam di Light & Dark Mode */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-background/85 lg:bg-transparent lg:bg-gradient-to-r lg:from-background/95 lg:via-background/85 lg:to-background/55"
      />

      {/* Konten Utama Hero */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Kolom Kiri: Form Pelacakan */}
          <div className="lg:col-span-7 space-y-6">
            <Badge variant="info" className="gap-1.5 py-1 px-3">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              <span>Pelacakan Publik Transparan &amp; Tanpa Login</span>
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              Lacak progres motor{" "}
              <span className="text-primary">kesayangan Anda</span>
            </h1>

            <p className="text-foreground/85 text-base sm:text-lg leading-relaxed max-w-prose">
              Masukkan kode pesanan dari nota atau pesan bengkel untuk memantau
              tahapan pengerjaan, foto perkembangan berkala, dan status kesiapan
              motor Anda.
            </p>

            <form
              action="/lacak"
              method="GET"
              className="space-y-3 pt-2 max-w-lg"
            >
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
                  className="h-12 pl-10 pr-4 font-mono text-base uppercase tracking-wider bg-card shadow-sm"
                />
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto px-7 shadow-sm">
                <span>Lacak Pesanan</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground">
              * Privasi aman: Data pribadi dan rincian biaya tidak ditampilkan di
              halaman pelacakan publik.
            </p>
          </div>

          {/* Kolom Kanan: Sorotan Proses Bengkel */}
          <div className="lg:col-span-5">
            <Card className="py-0 gap-0 shadow-md bg-card">
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
                      Montir mendokumentasikan progres nyata dari bongkar bodi
                      hingga uji coba.
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
                      Ketahui proses aktif seperti antre cat atau tunggu
                      kedatangan suku cadang.
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
                      Pengerjaan terpantau teratur tanpa perlu bolak-balik
                      menghubungi bengkel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
