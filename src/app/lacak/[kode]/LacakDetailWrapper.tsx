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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
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

export function LacakDetailWrapper({ trackingData }: TrackingDataProps) {
  // Hitung tahap aktif
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col justify-between">
      {/* Header Navbar Sesuai Wireframe Page 14 & 16 */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/lacak" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">
                Garage<span className="text-orange-500">Log</span>
              </span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium hidden sm:block">
                Pelacakan Progres Modifikasi
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/lacak"
              className="text-xs font-semibold text-slate-600 hover:text-orange-600 dark:text-zinc-400 dark:hover:text-orange-400 transition-colors"
            >
              Lacak Pesanan Lain
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1 space-y-6">
        {/* Subheader: Kode Pesanan, Status, Ganti Kode Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Kode Pesanan</p>
            <div className="flex items-center gap-3 mt-0.5">
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white tracking-wide">
                {trackingData.kodePesanan}
              </h1>
              <Badge
                variant={
                  trackingData.statusPesanan === "Selesai"
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

          <Link href="/lacak">
            <Button variant="outline" size="sm" className="text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Ganti kode</span>
            </Button>
          </Link>
        </div>

        {/* Banner Pembaruan Baru Sesuai Wireframe Page 14 & 16 */}
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Pembaruan riil langsung dari bengkel. Halaman ini terhubung langsung ke database bengkel.
            </span>
          </div>
          <span className="hidden sm:inline-block text-[10px] text-amber-700 dark:text-amber-400 font-mono">
            Live Database
          </span>
        </div>

        {/* Stepper Tahap Pengerjaan */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <CardTitle className="text-sm">Tahap Pengerjaan Motor</CardTitle>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                Saat ini: {currentStage?.nama || "Pengerjaan"} (tahap {currentDisplayIndex} dari{" "}
                {trackingData.tahapan.length})
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              {/* Stepper line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

              <div
                className={`grid gap-4 relative z-10 grid-cols-2 sm:grid-cols-${Math.min(
                  trackingData.tahapan.length,
                  6
                )}`}
              >
                {trackingData.tahapan.map((t, idx) => {
                  const isDone = t.status === "selesai";
                  const isCurrent = t.status === "berjalan";
                  return (
                    <div key={t.id} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                          isDone
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                            : isCurrent
                            ? "bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-md"
                            : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500 border border-slate-200 dark:border-zinc-700"
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <p
                          className={`text-xs font-bold ${
                            isCurrent
                              ? "text-orange-600 dark:text-orange-400"
                              : isDone
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-400 dark:text-zinc-500"
                          }`}
                        >
                          {t.nama}
                        </p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {isDone ? "Selesai" : isCurrent ? "Sedang berjalan" : "Belum mulai"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2 Kolom Layout (Linimasa di Kiri, Info Motor & Kontak di Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Linimasa Progres (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span>Linimasa Riwayat Pengerjaan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {trackingData.timeline.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    Belum ada riwayat pengerjaan atau catatan dari montir.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 dark:border-zinc-800 ml-3 space-y-8 pl-6">
                    {trackingData.timeline.map((item, idx) => (
                      <div key={item.id} className="relative space-y-2">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 ${
                            idx === 0
                              ? "bg-orange-500 ring-4 ring-orange-500/20"
                              : item.tipe === "informasi"
                              ? "bg-sky-500"
                              : "bg-slate-400 dark:bg-zinc-600"
                          }`}
                        />

                        {/* Header timestamp & title */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                            {formatDateTime(item.waktu)}
                          </span>
                          {item.tipe === "informasi" && (
                            <Badge variant="info" className="text-[10px]">
                              Informasi
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.judul}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed bg-slate-50 dark:bg-zinc-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                          {item.catatan}
                        </p>

                        {/* Foto Progres Galeri */}
                        {item.fotos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            {item.fotos.map((imgUrl, fIdx) => (
                              <div
                                key={fIdx}
                                className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 shadow-sm"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imgUrl}
                                  alt={`Dokumentasi foto ${item.judul}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
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
            {/* Kartu Motor */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-sm">Kendaraan Pelanggan</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3 text-xs">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {trackingData.kendaraan.merekModel}
                  </h3>
                  <p className="text-slate-500 dark:text-zinc-400">
                    Tahun {trackingData.kendaraan.tahun} &bull; Plat: {trackingData.kendaraan.nomorPolisi}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 block">
                    Paket Modifikasi:
                  </span>
                  <ul className="list-disc list-inside text-slate-600 dark:text-zinc-400 space-y-0.5">
                    {trackingData.daftarModifikasi.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300 block">
                    Perkiraan Selesai:
                  </span>
                  <p className="text-orange-600 dark:text-orange-400 font-bold text-sm mt-0.5">
                    {formatDate(trackingData.perkiraanSelesai)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Kartu Pembayaran Ringkas (Privasi Terjamin FR-23) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
                <CardTitle className="text-sm">Status Pembayaran</CardTitle>
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
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Rincian nominal tidak ditampilkan di halaman publik ini demi menjaga privasi dan
                  keamanan data keuangan Anda.
                </p>
                <p className="text-slate-700 dark:text-zinc-300 font-medium">
                  Silakan lihat lembar nota resmi bengkel atau hubungi kasir kami untuk konfirmasi
                  pelunasan.
                </p>
              </CardContent>
            </Card>

            {/* Kartu Ada Pertanyaan? */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-500" />
                  <span>Ada Pertanyaan?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2 text-xs">
                <p className="text-slate-500 dark:text-zinc-400">
                  Butuh informasi lebih lanjut mengenai pengerjaan motor Anda?
                </p>
                <div className="pt-2 space-y-1 font-semibold">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Phone className="w-3.5 h-3.5 text-orange-500" />
                    <span>Telepon / WA: 0812-3456-7890</span>
                  </div>
                  <p className="text-slate-500 dark:text-zinc-400 text-[11px] pl-5.5">
                    Jam operasional: 08.30 – 17.30 WIB
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-400">
          <div>GarageLog Workshop &bull; Jalan Raya Otomotif No. 123 &bull; Telepon: 0812-3456-7890</div>
          <div>Layanan Transparan Bengkel Modifikasi Motor</div>
        </div>
      </footer>
    </div>
  );
}
