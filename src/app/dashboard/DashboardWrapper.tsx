"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  TrendingUp,
  Package,
} from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDateTime } from "@/utils/formatDate";

interface DashboardStatsData {
  activeOrders: number;
  pendingApproval: number;
  readyOrders: number;
  lowStockCount: number;
  lowStockItems: {
    id: number;
    nama: string;
    SKU: string;
    stok: number;
    stok_minimum: number;
  }[];
  recentUpdates: any[];
}

interface DashboardWrapperProps {
  initialStats: DashboardStatsData;
}

export function DashboardWrapper({ initialStats }: DashboardWrapperProps) {
  const stats = [
    {
      label: "Pesanan aktif",
      count: initialStats.activeOrders,
      icon: ClipboardList,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      link: "/pesanan",
    },
    {
      label: "Menunggu persetujuan",
      count: initialStats.pendingApproval,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      link: "/pesanan",
    },
    {
      label: "Siap diambil",
      count: initialStats.readyOrders,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      link: "/pesanan",
    },
    {
      label: "Stok menipis",
      count: initialStats.lowStockCount,
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      link: "/stok",
    },
  ];

  return (
    <StaffLayout>
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Ringkasan kondisi bengkel modifikasi motor hari ini secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pesanan/buat">
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Buat Pesanan Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Kartu KPI Sesuai Wireframe Page 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Link key={idx} href={s.link}>
              <Card className="hover:border-slate-400 dark:hover:border-zinc-600 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">{s.label}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                      {String(s.count).padStart(2, "0")}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center font-bold`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Grid Utama 2 Kolom: Peringatan Stok & Aktivitas Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Peringatan Stok Menipis (FR-15) */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <CardTitle className="text-base">Peringatan Stok Suku Cadang (FR-15)</CardTitle>
              </div>
              <Link href="/stok" className="text-xs text-orange-600 hover:underline">
                Kelola Stok
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {initialStats.lowStockItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Semua stok suku cadang dalam kondisi aman.
                  </div>
                ) : (
                  initialStats.lowStockItems.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-xs text-slate-900 dark:text-white">
                          {item.nama}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{item.SKU}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-rose-600">
                          Sisa: {item.stok} (Min: {item.stok_minimum})
                        </span>
                        <Link href="/stok">
                          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                            Restok
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pembaruan Terkini (Append-Only Audit Trail) */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-base">Aktivitas Pengerjaan Terkini</CardTitle>
              </div>
              <Link href="/tugas" className="text-xs text-orange-600 hover:underline">
                Lihat Semua Tugas
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {initialStats.recentUpdates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Belum ada riwayat aktivitas pengerjaan.
                  </div>
                ) : (
                  initialStats.recentUpdates.map((up) => {
                    const motor = up.tahapPesanan?.pesanan?.kendaraan;
                    const kode = up.tahapPesanan?.pesanan?.kode_pesanan;
                    return (
                      <div key={up.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-orange-600">
                              {kode}
                            </span>
                            <span className="text-xs text-slate-500">
                              &bull; {motor ? `${motor.merek} ${motor.model}` : "Motor"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-zinc-300">
                            {up.catatan || `Pembaruan tahap: ${up.tahapPesanan?.nama}`}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Oleh {up.userPembuat?.nama || "Staf"} &bull; {formatDateTime(up.waktu)}
                          </p>
                        </div>
                        {kode && (
                          <Link href={`/pesanan/${kode}`}>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 shrink-0">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
}
