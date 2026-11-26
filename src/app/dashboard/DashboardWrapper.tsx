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
} from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/utils/formatDate";
import type { FeatureCode } from "@/lib/rbac";
import type { PeranUser } from "@prisma/client";

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
  activeStaff?: { nama: string; peran: PeranUser };
  allowedFeatures?: Partial<Record<FeatureCode, boolean>>;
  canCreateOrder?: boolean;
}

export function DashboardWrapper({
  initialStats,
  activeStaff,
  allowedFeatures,
  canCreateOrder = true,
}: DashboardWrapperProps) {
  const stats = [
    {
      label: "Pesanan aktif",
      count: initialStats.activeOrders,
      icon: ClipboardList,
      color: "text-muted-foreground",
      link: "/pesanan",
    },
    {
      label: "Menunggu persetujuan",
      count: initialStats.pendingApproval,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      link: "/pesanan",
    },
    {
      label: "Siap diambil",
      count: initialStats.readyOrders,
      icon: CheckCircle2,
      color: "text-primary",
      link: "/pesanan",
    },
    {
      label: "Stok menipis",
      count: initialStats.lowStockCount,
      icon: AlertTriangle,
      color: "text-destructive",
      link: "/stok",
    },
  ];

  return (
    <StaffLayout activeStaff={activeStaff} allowedFeatures={allowedFeatures}>
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan kondisi bengkel modifikasi motor hari ini secara real-time.
          </p>
        </div>

        {canCreateOrder && (
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/pesanan/buat">
              <Plus className="size-4" aria-hidden="true" />
              <span>Buat Pesanan Baru</span>
            </Link>
          </Button>
        )}
      </div>

      {/* 4 Kartu KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <Link
              key={idx}
              href={s.link}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="py-0 gap-0 hover:border-foreground/30 transition-colors cursor-pointer">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="text-3xl font-extrabold tabular-nums text-foreground mt-1">
                      {String(s.count).padStart(2, "0")}
                    </p>
                  </div>
                  <Icon className={`size-4 mt-0.5 shrink-0 ${s.color}`} aria-hidden="true" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Grid Utama 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Peringatan Stok Menipis */}
        <div className="lg:col-span-6">
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" aria-hidden="true" />
                <CardTitle className="text-base font-semibold">
                  Peringatan Stok Suku Cadang (FR-15)
                </CardTitle>
              </div>
              <Link
                href="/stok"
                className="text-xs font-medium text-primary hover:underline"
              >
                Kelola Stok
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {initialStats.lowStockItems.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Semua stok suku cadang dalam kondisi aman.
                  </div>
                ) : (
                  initialStats.lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate">
                          {item.nama}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {item.SKU}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold tabular-nums text-destructive">
                          Sisa: {item.stok} (Min: {item.stok_minimum})
                        </span>
                        <Button asChild variant="outline" size="xs">
                          <Link href="/stok">Restok</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pembaruan Terkini */}
        <div className="lg:col-span-6">
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 border-b border-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" aria-hidden="true" />
                <CardTitle className="text-base font-semibold">
                  Aktivitas Pengerjaan Terkini
                </CardTitle>
              </div>
              <Link
                href="/tugas"
                className="text-xs font-medium text-primary hover:underline"
              >
                Lihat Semua Tugas
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {initialStats.recentUpdates.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Belum ada riwayat aktivitas pengerjaan.
                  </div>
                ) : (
                  initialStats.recentUpdates.map((up) => {
                    const motor = up.tahapPesanan?.pesanan?.kendaraan;
                    const kode = up.tahapPesanan?.pesanan?.kode_pesanan;
                    return (
                      <div
                        key={up.id}
                        className="p-4 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-primary">
                              {kode}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              &bull;{" "}
                              {motor ? `${motor.merek} ${motor.model}` : "Motor"}
                            </span>
                          </div>
                          <p className="text-xs text-foreground">
                            {up.catatan ||
                              `Pembaruan tahap: ${up.tahapPesanan?.nama}`}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Oleh {up.userPembuat?.nama || "Staf"} &bull;{" "}
                            {formatDateTime(up.waktu)}
                          </p>
                        </div>
                        {kode && (
                          <Button
                            asChild
                            variant="outline"
                            size="icon-xs"
                            className="shrink-0"
                          >
                            <Link
                              href={`/pesanan/${kode}`}
                              aria-label={`Lihat detail pesanan ${kode}`}
                            >
                              <ArrowRight className="size-3.5" aria-hidden="true" />
                            </Link>
                          </Button>
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
