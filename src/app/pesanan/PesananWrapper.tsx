"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Filter, Eye } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { formatDate } from "@/utils/formatDate";

interface PesananWrapperProps {
  initialOrders: any[];
}

export function PesananWrapper({ initialOrders }: PesananWrapperProps) {
  const [orders, setOrders] = React.useState<any[]>(initialOrders);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("semua");
  const [paymentFilter, setPaymentFilter] = React.useState("semua");

  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const formattedOrders = orders.map((o) => {
    const totalPaid = o.pembayaran.reduce((sum: number, p: any) => sum + Number(p.jumlah), 0);
    const totalEstimasi = Number(o.estimasi_total);

    let bayarStatus = "Belum Bayar";
    if (totalPaid >= totalEstimasi && totalEstimasi > 0) {
      bayarStatus = "Lunas";
    } else if (totalPaid > 0) {
      bayarStatus = "Sebagian";
    }

    return {
      id: o.id,
      kode: o.kode_pesanan,
      pelanggan: o.pelanggan?.nama || "-",
      kendaraan: o.kendaraan ? `${o.kendaraan.merek} ${o.kendaraan.model}` : "-",
      nopol: o.kendaraan?.nomor_polisi || "-",
      modifikasi: o.itemJasa?.map((j: any) => j.jasa?.nama).filter(Boolean).join(", ") || "Kustom Standar",
      status: o.status,
      tahap: o.tahapan?.[0]?.nama || (o.status === "Selesai" ? "Selesai" : "-"),
      bayar: bayarStatus,
      perkiraan: formatDate(o.perkiraan_selesai),
    };
  });

  const filteredOrders = formattedOrders.filter((ord) => {
    const matchSearch =
      ord.kode.toLowerCase().includes(search.toLowerCase()) ||
      ord.pelanggan.toLowerCase().includes(search.toLowerCase()) ||
      ord.nopol.toLowerCase().includes(search.toLowerCase()) ||
      ord.kendaraan.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "semua" || ord.status === statusFilter;
    const matchPayment = paymentFilter === "semua" || ord.bayar === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  return (
    <StaffLayout>
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pesanan Modifikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Daftar seluruh pesanan modifikasi aktif, riwayat pengerjaan, dan status pembayaran.
          </p>
        </div>

        <Link href="/pesanan/buat">
          <Button size="sm" className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1.5" />
            <span>+ Buat Pesanan Baru</span>
          </Button>
        </Link>
      </div>

      {/* Filter Bar Sesuai Wireframe Page 3 */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode pesanan, pelanggan, motor, atau plat..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            {/* Filter Status Pengerjaan */}
            <div className="sm:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              >
                <option value="semua">Semua status</option>
                <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
                <option value="Dikerjakan">Dikerjakan</option>
                <option value="Siap Diambil">Siap Diambil</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            {/* Filter Status Pembayaran */}
            <div className="sm:col-span-3">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              >
                <option value="semua">Semua pembayaran</option>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="Sebagian">Sebagian (DP)</option>
                <option value="Lunas">Lunas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pesanan Sesuai Wireframe Page 3 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 font-mono">Kode Pesanan</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Kendaraan</th>
                <th className="py-3 px-4">Paket Modifikasi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Tahap Aktif</th>
                <th className="py-3 px-4 text-center">Pembayaran</th>
                <th className="py-3 px-4 text-right">Perkiraan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ada pesanan yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {ord.kode}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {ord.pelanggan}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 dark:text-white">{ord.kendaraan}</p>
                      <p className="text-[11px] font-mono text-slate-400">{ord.nopol}</p>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-600 dark:text-zinc-300">
                      {ord.modifikasi}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          ord.status === "Selesai"
                            ? "ready"
                            : ord.status === "Dikerjakan"
                            ? "progress"
                            : ord.status === "Siap Diambil"
                            ? "ready"
                            : "pending"
                        }
                        className="text-[10px] px-2.5"
                      >
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-zinc-300">
                      {ord.tahap}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          ord.bayar === "Lunas"
                            ? "ready"
                            : ord.bayar === "Sebagian"
                            ? "pending"
                            : "danger"
                        }
                        className="text-[10px]"
                      >
                        {ord.bayar}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-zinc-400 whitespace-nowrap">
                      {ord.perkiraan}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link href={`/pesanan/${ord.kode}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px]">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Detail</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </StaffLayout>
  );
}
