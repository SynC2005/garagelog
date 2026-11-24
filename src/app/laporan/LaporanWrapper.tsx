"use client";

import * as React from "react";
import { BarChart3, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import { getFilteredReportAction } from "@/server/api/laporan/laporanApi";

interface OrderReportItem {
  id: number;
  kode_pesanan: string;
  tanggal: Date;
  status: string;
  estimasi_total: number;
  subtotalJasa: number;
  subtotalSukuCadang: number;
  terbayar: number;
}

interface WorkStageBreakdownItem {
  tahap: string;
  rataRataHari: number;
  pesananSelesai: number;
}

interface ReportData {
  totalPenjualan: number;
  totalJasa: number;
  totalSukuCadang: number;
  totalTerbayar: number;
  jumlahPesanan: number;
  rataRataLamaPengerjaan: number;
  orders: OrderReportItem[];
  workStagesBreakdown: WorkStageBreakdownItem[];
}

interface LaporanWrapperProps {
  initialData: ReportData;
}

export function LaporanWrapper({ initialData }: LaporanWrapperProps) {
  const [data, setData] = React.useState<ReportData>(initialData);

  const todayStr = new Date().toISOString().split("T")[0];
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().split("T")[0];

  const [fromDate, setFromDate] = React.useState(lastMonthStr);
  const [toDate, setToDate] = React.useState(todayStr);
  const [grouping, setGrouping] = React.useState("mingguan");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const handleApplyFilter = async () => {
    setIsLoading(true);
    const res = await getFilteredReportAction(fromDate, toDate);
    setIsLoading(false);
    if (res.success && res.data) {
      setData(res.data);
      toast.success("Data laporan berhasil diperbarui.");
    } else {
      toast.error(res.error || "Gagal memuat laporan.");
    }
  };

  return (
    <StaffLayout activeStaff={{ nama: "Pak Hendro", peran: "Pemilik" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Laporan &amp; Analitik
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Laporan penjualan dan statistik durasi pengerjaan modifikasi per
          periode.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1.5">
              <Label
                htmlFor="report-from"
                className="text-xs font-semibold text-muted-foreground"
              >
                Dari tanggal
              </Label>
              <Input
                id="report-from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <Label
                htmlFor="report-to"
                className="text-xs font-semibold text-muted-foreground"
              >
                Sampai tanggal
              </Label>
              <Input
                id="report-to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Kelompok
              </Label>
              <Select value={grouping} onValueChange={setGrouping}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih kelompok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="mingguan">Mingguan</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-1">
              <Button
                size="sm"
                className="w-full text-xs h-9"
                onClick={handleApplyFilter}
                disabled={isLoading}
              >
                {isLoading ? "..." : "Terapkan"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="penjualan" className="space-y-6">
        <TabsList>
          <TabsTrigger value="penjualan" className="text-xs sm:text-sm">
            Penjualan
          </TabsTrigger>
          <TabsTrigger value="pengerjaan" className="text-xs sm:text-sm">
            Pengerjaan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="penjualan" className="space-y-6">
          {/* 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="py-0 gap-0">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total penjualan (Omzet)
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground mt-1">
                    {formatCurrency(data.totalPenjualan)}
                  </p>
                </div>
                <div className="size-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="size-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Jumlah pesanan
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground mt-1">
                    {data.jumlahPesanan} unit
                  </p>
                </div>
                <div className="size-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <BarChart3 className="size-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>

            <Card className="py-0 gap-0">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Rata-rata lama pengerjaan
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-foreground mt-1">
                    {data.rataRataLamaPengerjaan} hari
                  </p>
                </div>
                <div className="size-11 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Clock className="size-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grafik Batang Penjualan */}
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Grafik Penjualan Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {data.orders.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
                  Tidak ada data transaksi pada rentang tanggal yang dipilih.
                </div>
              ) : (
                <div className="h-44 flex items-end justify-start gap-6 pt-6 overflow-x-auto">
                  {data.orders.map((ord, i) => {
                    const maxH = Math.max(
                      ...data.orders.map((o) => o.estimasi_total),
                      1
                    );
                    const heightPct = Math.max(
                      15,
                      Math.round((ord.estimasi_total / maxH) * 100)
                    );
                    return (
                      <div
                        key={i}
                        className="min-w-[90px] flex-1 flex flex-col items-center gap-2"
                      >
                        <span className="text-[11px] font-bold tabular-nums text-foreground">
                          {formatCurrency(ord.estimasi_total)}
                        </span>
                        <div className="w-full bg-muted rounded-t-md h-32 flex items-end">
                          <div
                            className="w-full bg-primary hover:opacity-90 rounded-t-md transition-opacity"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground text-center truncate max-w-full">
                          {ord.kode_pesanan}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabel Rincian Penjualan */}
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Rincian Penjualan Per Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="px-4 font-mono">
                      Kode Pesanan
                    </TableHead>
                    <TableHead className="px-4">Tanggal</TableHead>
                    <TableHead className="px-4 text-right">
                      Subtotal Jasa
                    </TableHead>
                    <TableHead className="px-4 text-right">
                      Subtotal Suku Cadang
                    </TableHead>
                    <TableHead className="px-4 text-right font-bold">
                      Total Omzet
                    </TableHead>
                    <TableHead className="px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      Terbayar
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Tidak ada transaksi yang tercatat pada periode ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.orders.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="px-4 py-3 font-mono font-semibold text-primary">
                          {row.kode_pesanan}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(row.tanggal)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(row.subtotalJasa)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(row.subtotalSukuCadang)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                          {formatCurrency(row.estimasi_total)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.terbayar)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pengerjaan">
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Durasi Rata-rata per Tahap Modifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="px-4">
                      Nama Tahapan Pengerjaan
                    </TableHead>
                    <TableHead className="px-4 text-center">
                      Rata-rata Waktu
                    </TableHead>
                    <TableHead className="px-4 text-center">
                      Unit Selesai
                    </TableHead>
                    <TableHead className="px-4">Efisiensi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.workStagesBreakdown.map((w, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="px-4 py-3 font-semibold text-foreground">
                        {idx + 1}. {w.tahap}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center font-bold tabular-nums text-primary">
                        {w.rataRataHari} hari
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                        {w.pesananSelesai} pesanan
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Progress
                          value={Math.max(20, 100 - w.rataRataHari * 15)}
                          className="w-36 h-2"
                          aria-label={`Efisiensi ${w.tahap}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StaffLayout>
  );
}
