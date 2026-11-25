"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Eye, Wrench } from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/utils/formatDate";
import { assignOrderMechanicAction } from "@/server/api/pesanan/pesananApi";
import type { FeatureCode } from "@/lib/rbac";
import type { PeranUser } from "@prisma/client";

interface MechanicOption {
  id: number;
  nama: string;
  email: string;
}

interface PesananWrapperProps {
  initialOrders: any[];
  mechanics?: MechanicOption[];
  activeStaff?: { nama: string; peran: PeranUser };
  allowedFeatures?: Partial<Record<FeatureCode, boolean>>;
  canManage?: boolean;
}

export function PesananWrapper({
  initialOrders,
  mechanics = [],
  activeStaff,
  allowedFeatures,
  canManage = true,
}: PesananWrapperProps) {
  const [orders, setOrders] = React.useState<any[]>(initialOrders);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("semua");
  const [paymentFilter, setPaymentFilter] = React.useState("semua");
  const [assigningOrderId, setAssigningOrderId] = React.useState<number | null>(
    null
  );

  React.useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleAssignMechanic = async (
    pesananId: number,
    value: string
  ) => {
    const nextMontirId = value === "none" ? null : Number(value);
    setAssigningOrderId(pesananId);
    const res = await assignOrderMechanicAction(pesananId, nextMontirId);
    setAssigningOrderId(null);

    if (res.success && res.data) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === pesananId
            ? {
                ...o,
                montir_id: res.data.montir_id,
                montirDitugaskan: res.data.montirDitugaskan,
              }
            : o
        )
      );
      toast.success(
        res.data.montirDitugaskan
          ? `Pesanan ${res.data.kode_pesanan} ditugaskan ke ${res.data.montirDitugaskan.nama}.`
          : `Penugasan montir pada pesanan ${res.data.kode_pesanan} dilepas.`
      );
    } else {
      toast.error(res.error || "Gagal menugaskan montir.");
    }
  };

  const formattedOrders = orders.map((o) => {
    const totalPaid = o.pembayaran.reduce(
      (sum: number, p: any) => sum + Number(p.jumlah),
      0
    );
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
      kendaraan: o.kendaraan
        ? `${o.kendaraan.merek} ${o.kendaraan.model}`
        : "-",
      nopol: o.kendaraan?.nomor_polisi || "-",
      modifikasi:
        o.itemJasa
          ?.map((j: any) => j.jasa?.nama)
          .filter(Boolean)
          .join(", ") || "Kustom Standar",
      status: o.status,
      tahap: o.tahapan?.[0]?.nama || (o.status === "Selesai" ? "Selesai" : "-"),
      montirId: o.montir_id ? String(o.montir_id) : "none",
      montirNama: o.montirDitugaskan?.nama || null,
      bayar: bayarStatus,
      perkiraan: formatDate(o.perkiraan_selesai),
    };
  });

  const filteredOrders = formattedOrders.filter((ord) => {
    const q = search.toLowerCase();
    const matchSearch =
      ord.kode.toLowerCase().includes(q) ||
      ord.pelanggan.toLowerCase().includes(q) ||
      ord.nopol.toLowerCase().includes(q) ||
      ord.kendaraan.toLowerCase().includes(q) ||
      (ord.montirNama && ord.montirNama.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === "semua" || ord.status === statusFilter;
    const matchPayment =
      paymentFilter === "semua" || ord.bayar === paymentFilter;

    return matchSearch && matchStatus && matchPayment;
  });

  return (
    <StaffLayout activeStaff={activeStaff} allowedFeatures={allowedFeatures}>
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Pesanan Modifikasi
            </h1>
            {!canManage && (
              <Badge variant="outline" className="text-[11px]">
                Mode Baca Saja
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar seluruh pesanan modifikasi aktif, penugasan montir, dan status
            pembayaran.
          </p>
        </div>

        {canManage && (
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/pesanan/buat">
              <Plus className="size-4" aria-hidden="true" />
              <span>Buat Pesanan Baru</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card className="py-0 gap-0">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 relative">
              <Search
                className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cari pesanan"
                placeholder="Cari kode, pelanggan, motor, plat, atau montir..."
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-9 text-xs" aria-label="Filter status pengerjaan">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua status</SelectItem>
                  <SelectItem value="Menunggu Persetujuan">
                    Menunggu Persetujuan
                  </SelectItem>
                  <SelectItem value="Dikerjakan">Dikerjakan</SelectItem>
                  <SelectItem value="Siap Diambil">Siap Diambil</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-3">
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full h-9 text-xs" aria-label="Filter status pembayaran">
                  <SelectValue placeholder="Semua pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua pembayaran</SelectItem>
                  <SelectItem value="Belum Bayar">Belum Bayar</SelectItem>
                  <SelectItem value="Sebagian">Sebagian (DP)</SelectItem>
                  <SelectItem value="Lunas">Lunas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Pesanan */}
      <Card className="py-0 gap-0 overflow-hidden">
        <Table className="text-xs">
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="px-4 font-mono">Kode Pesanan</TableHead>
              <TableHead className="px-4">Pelanggan</TableHead>
              <TableHead className="px-4">Kendaraan</TableHead>
              <TableHead className="px-4">Paket Modifikasi</TableHead>
              <TableHead className="px-4 text-center">Status</TableHead>
              <TableHead className="px-4">Tahap Aktif</TableHead>
              <TableHead className="px-4 min-w-[165px]">Montir</TableHead>
              <TableHead className="px-4 text-center">Pembayaran</TableHead>
              <TableHead className="px-4 text-right">Perkiraan</TableHead>
              <TableHead className="px-4 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="py-10 text-center text-muted-foreground"
                >
                  Tidak ada pesanan yang sesuai dengan pencarian atau filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((ord) => (
                <TableRow key={ord.id}>
                  <TableCell className="px-4 py-3 font-mono font-bold text-primary">
                    {ord.kode}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-foreground">
                    {ord.pelanggan}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="font-medium text-foreground">{ord.kendaraan}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      {ord.nopol}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                    {ord.modifikasi}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        ord.status === "Selesai" || ord.status === "Siap Diambil"
                          ? "ready"
                          : ord.status === "Dikerjakan"
                          ? "progress"
                          : ord.status === "Dibatalkan"
                          ? "cancelled"
                          : "pending"
                      }
                      className="text-[10px]"
                    >
                      {ord.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-foreground">
                    {ord.tahap}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {canManage ? (
                      <Select
                        value={ord.montirId}
                        disabled={assigningOrderId === ord.id}
                        onValueChange={(val) => handleAssignMechanic(ord.id, val)}
                      >
                        <SelectTrigger
                          className="h-8 text-[11px] min-w-[150px]"
                          aria-label={`Tugaskan montir untuk ${ord.kode}`}
                        >
                          <SelectValue placeholder="Pilih montir" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Belum ditugaskan</SelectItem>
                          {mechanics.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : ord.montirNama ? (
                      <Badge variant="progress" className="text-[10px] gap-1">
                        <Wrench className="size-3" aria-hidden="true" />
                        <span>{ord.montirNama}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Belum ditugaskan
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
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
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-medium text-muted-foreground tabular-nums">
                    {ord.perkiraan}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Button asChild variant="outline" size="xs">
                      <Link href={`/pesanan/${ord.kode}`}>
                        <Eye className="size-3.5" aria-hidden="true" />
                        <span>Detail</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </StaffLayout>
  );
}
