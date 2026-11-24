"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wrench,
  ArrowLeft,
  Clock,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Phone,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDateTime } from "@/utils/formatDate";

interface StageInfo {
  id: number;
  nama: string;
  urutan: number;
  status: string;
  wajibFoto: boolean;
}

interface TimelineItem {
  id: number;
  waktu: Date;
  judul: string;
  tahapNama: string;
  tipe: "tahap" | "informasi";
  catatan: string;
  fotos: string[];
}

interface TrackingDataProps {
  trackingData: {
    kodePesanan: string;
    statusPesanan: string;
    perkiraanSelesai: Date | null;
    kendaraan: {
      merekModel: string;
      tahun: number;
      nomorPolisi: string;
    };
    daftarModifikasi: string[];
    tahapan: StageInfo[];
    timeline: TimelineItem[];
    statusPembayaranRingkas: "Belum Bayar" | "Sebagian" | "Lunas";
  };
}

const stepperColsMap: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
  6: "sm:grid-cols-6",
};

export function LacakDetailWrapper({ trackingData }: TrackingDataProps) {
  const currentStageIndex = trackingData.tahapan.findIndex(
    (t) => t.status === "berjalan"
  );
  const currentStage =
    currentStageIndex !== -1
      ? trackingData.tahapan[currentStageIndex]
      : trackingData.tahapan[trackingData.tahapan.length - 1];

  const currentDisplayIndex =
    currentStageIndex !== -1
      ? currentStageIndex + 1
      : trackingData.tahapan.every((t) => t.status === "selesai")
      ? trackingData.tahapan.length
      : 1;

  const stepperColsClass =
    stepperColsMap[Math.min(Math.max(trackingData.tahapan.length, 1), 6)] ||
    "sm:grid-cols-6";

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col justify-between">
      {/* Header Navbar */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/lacak" className="flex items-center gap-2.5">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Wrench className="size-5" aria-hidden="true" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">
                Garage<span className="text-primary">Log</span>
              </span>
              <p className="text-[11px] text-muted-foreground font-medium hidden sm:block">
                Pelacakan Progres Modifikasi
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/lacak">Lacak Pesanan Lain</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Subheader: Kode Pesanan, Status, Ganti Kode Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Kode Pesanan</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-foreground tracking-wide">
                {trackingData.kodePesanan}
              </h1>
              <Badge
                variant={
                  trackingData.statusPesanan === "Selesai" ||
                  trackingData.statusPesanan === "Siap Diambil"
                    ? "ready"
                    : trackingData.statusPesanan === "Dikerjakan"
                    ? "progress"
                    : "pending"
                }
                className="text-xs px-3 py-1"
              >
                {trackingData.statusPesanan}
              </Badge>
            </div>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href="/lacak">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Ganti kode</span>
            </Link>
          </Button>
        </div>

        {/* Banner Info */}
        <Alert className="bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200">
          <Sparkles className="size-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between gap-2 w-full text-xs text-amber-900 dark:text-amber-200">
            <span>
              Pembaruan riil langsung dari bengkel. Halaman ini terhubung langsung ke
              database bengkel.
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-amber-700 dark:text-amber-400">
              Live Database
            </span>
          </AlertDescription>
        </Alert>

        {/* Stepper Tahap Pengerjaan */}
        <Card className="py-0 gap-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <CardTitle className="text-sm font-semibold">
                Tahap Pengerjaan Motor
              </CardTitle>
              <span className="text-xs font-semibold text-primary tabular-nums">
                Saat ini: {currentStage?.nama || "Pengerjaan"} (tahap{" "}
                {currentDisplayIndex} dari {trackingData.tahapan.length})
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-border hidden sm:block" />

              <div className={`grid gap-4 relative z-10 grid-cols-2 ${stepperColsClass}`}>
                {trackingData.tahapan.map((t, idx) => {
                  const isDone = t.status === "selesai";
                  const isCurrent = t.status === "berjalan";
                  return (
                    <div
                      key={t.id}
                      className="flex flex-col items-center text-center space-y-2"
                    >
                      <div
                        className={`size-9 rounded-full flex items-center justify-center font-bold text-xs tabular-nums transition-colors ${
                          isDone
                            ? "bg-foreground text-background shadow-xs"
                            : isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p
                          className={`text-xs font-semibold ${
                            isCurrent
                              ? "text-primary"
                              : isDone
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {t.nama}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {isDone
                            ? "Selesai"
                            : isCurrent
                            ? "Sedang berjalan"
                            : "Belum mulai"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2 Kolom Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Linimasa Progres (8 cols) */}
          <div className="lg:col-span-8">
            <Card className="py-0 gap-0">
              <CardHeader className="p-4 sm:p-5 border-b border-border">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-primary" aria-hidden="true" />
                  <span>Linimasa Riwayat Pengerjaan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {trackingData.timeline.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-xs">
                    Belum ada riwayat pengerjaan atau catatan dari montir.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-border ml-3 space-y-8 pl-6">
                    {trackingData.timeline.map((item, idx) => (
                      <div key={item.id} className="relative space-y-2">
                        <div
                          className={`absolute -left-[31px] top-1 size-4 rounded-full border-2 border-background ${
                            idx === 0
                              ? "bg-primary ring-4 ring-primary/20"
                              : item.tipe === "informasi"
                              ? "bg-sky-500"
                              : "bg-muted-foreground"
                          }`}
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {formatDateTime(item.waktu)}
                          </span>
                          {item.tipe === "informasi" && (
                            <Badge variant="info" className="text-[10px]">
                              Informasi
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-sm text-foreground">
                          {item.judul}
                        </h3>

                        <p className="text-xs text-foreground/90 leading-relaxed bg-muted/60 p-3.5 rounded-lg border border-border">
                          {item.catatan}
                        </p>

                        {item.fotos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            {item.fotos.map((imgUrl, fIdx) => (
                              <div
                                key={fIdx}
                                className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgUrl}
                                  alt={`Dokumentasi foto ${item.judul}`}
                                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Info Motor & Pembayaran Ringkas (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Card className="py-0 gap-0">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  Kendaraan Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {trackingData.kendaraan.merekModel}
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Tahun {trackingData.kendaraan.tahun} &bull; Plat:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {trackingData.kendaraan.nomorPolisi}
                    </span>
                  </p>
                </div>

                <Separator />

                <div className="space-y-1">
                  <span className="font-semibold text-foreground block">
                    Paket Modifikasi:
                  </span>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    {trackingData.daftarModifikasi.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <span className="font-semibold text-foreground block">
                    Perkiraan Selesai:
                  </span>
                  <p className="text-primary font-bold text-sm mt-0.5">
                    {formatDate(trackingData.perkiraanSelesai)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Kartu Pembayaran Ringkas (Privasi Terjamin FR-23) */}
            <Card className="py-0 gap-0">
              <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold">
                  Status Pembayaran
                </CardTitle>
                <Badge
                  variant={
                    trackingData.statusPembayaranRingkas === "Lunas"
                      ? "ready"
                      : trackingData.statusPembayaranRingkas === "Sebagian"
                      ? "pending"
                      : "danger"
                  }
                  className="text-xs"
                >
                  {trackingData.statusPembayaranRingkas}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Rincian nominal tidak ditampilkan di halaman publik ini demi menjaga
                  privasi dan keamanan data keuangan Anda.
                </p>
                <p className="text-foreground font-medium">
                  Silakan lihat lembar nota resmi bengkel atau hubungi kasir kami
                  untuk konfirmasi pelunasan.
                </p>
              </CardContent>
            </Card>

            {/* Kartu Ada Pertanyaan? */}
            <Card className="py-0 gap-0">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <HelpCircle className="size-4 text-primary" aria-hidden="true" />
                  <span>Ada Pertanyaan?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <p className="text-muted-foreground">
                  Butuh informasi lebih lanjut mengenai pengerjaan motor Anda?
                </p>
                <div className="pt-1 space-y-1 font-semibold">
                  <div className="flex items-center gap-2 text-foreground">
                    <Phone className="size-3.5 text-primary" aria-hidden="true" />
                    <span>Telepon / WA: 0812-3456-7890</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] pl-5.5 font-normal">
                    Jam operasional: 08.30 &ndash; 17.30 WIB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-border bg-card py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div>
            GarageLog Workshop &bull; Jalan Raya Otomotif No. 123 &bull; Telepon:
            0812-3456-7890
          </div>
          <div>Layanan Transparan Bengkel Modifikasi Motor</div>
        </div>
      </footer>
    </div>
  );
}
