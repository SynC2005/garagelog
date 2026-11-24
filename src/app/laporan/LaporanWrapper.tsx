"use client";

import * as React from "react";
import { BarChart3, DollarSign, Clock, Layers, Filter } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
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
  const [activeTab, setActiveTab] = React.useState<"penjualan" | "pengerjaan">("penjualan");

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
    } else {
      alert(res.error || "Gagal memuat laporan.");
    }
  };

  return (
    <StaffLayout activeStaff={{ nama: "Pak Hendro", peran: "Pemilik" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Laporan & Analitik
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Laporan penjualan dan statistik durasi pengerjaan modifikasi per periode.
        </p>
      </div>

      {/* Filter Bar Sesuai Wireframe Page 10 */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Dari tanggal
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            <div className="sm:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Sampai tanggal
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                Kelompok
              </label>
              <select
                value={grouping}
                onChange={(e) => setGrouping(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              >
                <option value="harian">Harian</option>
                <option value="mingguan">Mingguan</option>
                <option value="bulanan">Bulanan</option>
              </select>
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

      {/* Tab Navigation: Penjualan & Pengerjaan Sesuai Wireframe Page 10 */}
      <div className="border-b border-slate-200 dark:border-zinc-800 flex gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("penjualan")}
          className={`pb-3 relative transition-colors ${
            activeTab === "penjualan"
              ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-500"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Penjualan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pengerjaan")}
          className={`pb-3 relative transition-colors ${
            activeTab === "pengerjaan"
              ? "text-orange-600 dark:text-orange-400 border-b-2 border-orange-500"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Pengerjaan
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "penjualan" ? (
        <div className="space-y-6">
          {/* 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    Total penjualan (Omzet)
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {formatCurrency(data.totalPenjualan)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    Jumlah pesanan
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {data.jumlahPesanan} unit
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                    Rata-rata lama pengerjaan
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {data.rataRataLamaPengerjaan} hari
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grafik Batang Penjualan */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Grafik Penjualan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {data.orders.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                  Tidak ada data transaksi pada rentang tanggal yang dipilih.
                </div>
              ) : (
                <div className="h-44 flex items-end justify-start gap-6 pt-6 overflow-x-auto">
                  {data.orders.map((ord, i) => {
                    const maxH = Math.max(...data.orders.map((o) => o.estimasi_total), 1);
                    const heightPct = Math.max(15, Math.round((ord.estimasi_total / maxH) * 100));
                    return (
                      <div key={i} className="min-w-[90px] flex-1 flex flex-col items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                          {formatCurrency(ord.estimasi_total)}
                        </span>
                        <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-t-lg h-32 flex items-end">
                          <div
                            className="w-full bg-orange-500 hover:bg-orange-600 rounded-t-lg transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 text-center truncate max-w-full">
                          {ord.kode_pesanan}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabel Rincian Penjualan Sesuai Wireframe Page 10 */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Rincian Penjualan Per Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-4 font-mono">Kode Pesanan</th>
                      <th className="py-2.5 px-4">Tanggal</th>
                      <th className="py-2.5 px-4 text-right">Subtotal Jasa</th>
                      <th className="py-2.5 px-4 text-right">Subtotal Suku Cadang</th>
                      <th className="py-2.5 px-4 text-right font-bold">Total Omzet</th>
                      <th className="py-2.5 px-4 text-right font-bold text-emerald-600">Terbayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {data.orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ada transaksi yang tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      data.orders.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                          <td className="py-3 px-4 font-mono font-semibold text-orange-600 dark:text-orange-400">
                            {row.kode_pesanan}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {formatDate(row.tanggal)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-zinc-300">
                            {formatCurrency(row.subtotalJasa)}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600 dark:text-zinc-300">
                            {formatCurrency(row.subtotalSukuCadang)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                            {formatCurrency(row.estimasi_total)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(row.terbayar)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Tab Pengerjaan */
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
            <CardTitle className="text-base">Durasi Rata-rata per Tahap Modifikasi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Nama Tahapan Pengerjaan</th>
                    <th className="py-2.5 px-4 text-center">Rata-rata Waktu</th>
                    <th className="py-2.5 px-4 text-center">Unit Selesai</th>
                    <th className="py-2.5 px-4">Efisiensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {data.workStagesBreakdown.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {idx + 1}. {w.tahap}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-orange-600 dark:text-orange-400">
                        {w.rataRataHari} hari
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 dark:text-zinc-300">
                        {w.pesananSelesai} pesanan
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-36 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${Math.max(20, 100 - w.rataRataHari * 15)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </StaffLayout>
  );
}
