"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Printer,
  CheckCircle,
  CreditCard,
  Check,
  AlertCircle,
  CheckCircle2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  approveOrderAction,
  assignOrderMechanicAction,
  recordPaymentAction,
} from "@/server/api/pesanan/pesananApi";
import { MetodePembayaran, PeranUser, StatusPesanan } from "@prisma/client";
import type { FeatureCode } from "@/lib/rbac";

interface MechanicOption {
  id: number;
  nama: string;
  email: string;
}

interface DetailPesananWrapperProps {
  order: any;
  mechanics?: MechanicOption[];
  activeStaff?: { nama: string; peran: PeranUser };
  allowedFeatures?: Partial<Record<FeatureCode, boolean>>;
  canManageOrder?: boolean;
  canViewNota?: boolean;
  canManagePayment?: boolean;
}

export function DetailPesananWrapper({
  order: initialOrder,
  mechanics = [],
  activeStaff,
  allowedFeatures,
  canManageOrder = true,
  canViewNota = true,
  canManagePayment = true,
}: DetailPesananWrapperProps) {
  const [order, setOrder] = React.useState<any>(initialOrder);
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  React.useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<MetodePembayaran>(
    MetodePembayaran.transfer
  );
  const [paymentFormError, setPaymentFormError] = React.useState<string | null>(
    null
  );
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);

  // Approval Loading State
  const [isApproving, setIsApproving] = React.useState(false);
  const [isAssigningMechanic, setIsAssigningMechanic] = React.useState(false);

  const totalEstimasi = Number(order.estimasi_total);
  const totalDibayar = order.pembayaran.reduce(
    (s: number, p: any) => s + Number(p.jumlah),
    0
  );
  const sisaTagihan = Math.max(0, totalEstimasi - totalDibayar);

  const handleCopyLink = () => {
    const trackingUrl = `${window.location.origin}/lacak/${order.kode_pesanan}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    toast.success("Tautan pelacakan disalin ke clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const res = await approveOrderAction(order.id);
    setIsApproving(false);

    if (res.success && res.data) {
      setOrder((prev: any) => ({
        ...prev,
        status: StatusPesanan.Dikerjakan,
        disetujui_pada: new Date(),
      }));
      showNotification(
        "success",
        "Estimasi pesanan disetujui! Stok suku cadang terkait berhasil dipotong otomatis secara atomik (FR-13)."
      );
      toast.success("Pesanan disetujui dan stok otomatis terpotong.");
    } else {
      showNotification("error", res.error || "Gagal menyetujui pesanan.");
      toast.error(res.error || "Gagal menyetujui pesanan.");
    }
  };

  const handleAssignMechanic = async (value: string) => {
    const nextMontirId = value === "none" ? null : Number(value);
    setIsAssigningMechanic(true);
    const res = await assignOrderMechanicAction(order.id, nextMontirId);
    setIsAssigningMechanic(false);

    if (res.success && res.data) {
      setOrder((prev: any) => ({
        ...prev,
        montir_id: res.data.montir_id,
        montirDitugaskan: res.data.montirDitugaskan,
      }));
      const msg = res.data.montirDitugaskan
        ? `Pesanan ditugaskan kepada montir ${res.data.montirDitugaskan.nama}.`
        : "Penugasan montir pada pesanan ini dilepas.";
      showNotification("success", msg);
      toast.success(msg);
    } else {
      showNotification("error", res.error || "Gagal menugaskan montir.");
      toast.error(res.error || "Gagal menugaskan montir.");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentFormError(null);
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setPaymentFormError("Masukkan nominal pembayaran yang valid (lebih dari 0).");
      return;
    }

    setIsSubmittingPayment(true);
    const res = await recordPaymentAction({
      pesananId: order.id,
      jumlah: amount,
      metode: paymentMethod,
      dicatatOlehId: 1,
    });
    setIsSubmittingPayment(false);

    if (res.success && res.data) {
      setOrder((prev: any) => ({
        ...prev,
        pembayaran: [res.data, ...prev.pembayaran],
      }));
      setShowPaymentModal(false);
      setPaymentAmount("");
      showNotification(
        "success",
        `Pembayaran sebesar ${formatCurrency(amount)} berhasil dicatat!`
      );
      toast.success(`Pembayaran ${formatCurrency(amount)} berhasil dicatat.`);
    } else {
      setPaymentFormError(res.error || "Gagal mencatat pembayaran.");
    }
  };

  return (
    <StaffLayout activeStaff={activeStaff} allowedFeatures={allowedFeatures}>
      {/* Header Halaman */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/pesanan" aria-label="Kembali ke daftar pesanan">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-mono font-black text-foreground">
              {order.kode_pesanan}
            </h1>
            <Badge
              variant={
                order.status === StatusPesanan.Selesai ||
                order.status === StatusPesanan.Siap_Diambil
                  ? "ready"
                  : order.status === StatusPesanan.Dikerjakan
                  ? "progress"
                  : order.status === StatusPesanan.Dibatalkan
                  ? "cancelled"
                  : "pending"
              }
              className="text-xs px-3 py-1"
            >
              {order.status}
            </Badge>
          </div>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="text-xs"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            <span>{copied ? "Tautan Disalin!" : "Salin tautan pelacakan"}</span>
          </Button>

          {canViewNota && (
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href={`/pesanan/${order.kode_pesanan}/nota`}>
                <Printer className="size-3.5" aria-hidden="true" />
                <span>Cetak nota</span>
              </Link>
            </Button>
          )}

          {canManageOrder && order.status === StatusPesanan.Menunggu_Persetujuan && (
            <Button
              size="sm"
              variant="secondary"
              disabled={isApproving}
              className="text-xs"
              onClick={handleApprove}
            >
              <CheckCircle
                className="size-3.5 text-emerald-600 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span>
                {isApproving ? "Memproses..." : "Catat persetujuan estimasi"}
              </span>
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <Alert
          variant={feedback.type === "error" ? "destructive" : "default"}
          className={
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : undefined
          }
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="size-4" />
          )}
          <AlertDescription className="text-xs font-medium text-current">
            {feedback.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Grid 2 Kolom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Ringkasan Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-muted-foreground font-medium">Pelanggan</p>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {order.pelanggan?.nama}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {order.pelanggan?.telepon}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Kendaraan</p>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {order.kendaraan?.merek} {order.kendaraan?.model}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Tahun {order.kendaraan?.tahun} &bull;{" "}
                  <span className="font-mono">{order.kendaraan?.nomor_polisi}</span>
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Dibuat oleh</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {order.userPembuat?.nama || "Admin"} &bull;{" "}
                  {formatDate(order.created_at)}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">
                  Perkiraan selesai
                </p>
                <p className="font-semibold text-primary mt-0.5">
                  {formatDate(order.perkiraan_selesai)}
                </p>
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Montir Penanggung Jawab
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Hanya montir yang ditugaskan yang dapat melihat tugas ini di
                      halaman Tugas Pengerjaan.
                    </p>
                  </div>
                  {canManageOrder ? (
                    <Select
                      value={order.montir_id ? String(order.montir_id) : "none"}
                      disabled={isAssigningMechanic}
                      onValueChange={handleAssignMechanic}
                    >
                      <SelectTrigger
                        className="w-full sm:w-56 h-9 text-xs"
                        aria-label="Pilih montir penanggung jawab"
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
                  ) : order.montirDitugaskan ? (
                    <Badge variant="progress" className="text-xs gap-1.5 w-fit">
                      <Wrench className="size-3.5" aria-hidden="true" />
                      <span>{order.montirDitugaskan.nama}</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs w-fit">
                      Belum ditugaskan
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Rincian Jasa dan Suku Cadang
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="text-xs">
                <TableHeader className="bg-muted/60">
                  <TableRow>
                    <TableHead className="px-4">Item</TableHead>
                    <TableHead className="px-4">Jenis</TableHead>
                    <TableHead className="px-4 text-center">Jml</TableHead>
                    <TableHead className="px-4 text-right">Harga</TableHead>
                    <TableHead className="px-4 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.itemJasa.map((ij: any) => (
                    <TableRow key={`jasa-${ij.id}`}>
                      <TableCell className="px-4 py-2.5 font-medium text-foreground">
                        {ij.jasa?.nama}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-muted-foreground">
                        Jasa
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center font-mono tabular-nums">
                        1
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums">
                        {formatCurrency(ij.harga)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right font-bold tabular-nums">
                        {formatCurrency(ij.harga)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {order.itemSukuCadang.map((ic: any) => (
                    <TableRow key={`part-${ic.id}`}>
                      <TableCell className="px-4 py-2.5 font-medium text-foreground">
                        {ic.sukuCadang?.nama}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-muted-foreground">
                        Suku cadang
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-center font-mono tabular-nums">
                        {ic.jumlah}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right tabular-nums">
                        {formatCurrency(ic.harga)}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-right font-bold tabular-nums">
                        {formatCurrency(ic.harga * ic.jumlah)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Pembayaran
              </CardTitle>
              {canManagePayment && (
                <Button
                  size="xs"
                  onClick={() => {
                    setPaymentFormError(null);
                    setShowPaymentModal(true);
                  }}
                >
                  <CreditCard className="size-3.5" aria-hidden="true" />
                  <span>Catat Pembayaran</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Estimasi</span>
                  <span className="font-bold tabular-nums text-foreground">
                    {formatCurrency(totalEstimasi)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Total Terbayar</span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(totalDibayar)}
                  </span>
                </div>
                <div className="flex justify-between text-primary font-bold">
                  <span>Sisa Tagihan</span>
                  <span className="tabular-nums">{formatCurrency(sisaTagihan)}</span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-semibold text-foreground mb-2">
                  Riwayat Pembayaran:
                </p>
                {order.pembayaran.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Belum ada pembayaran tercatat.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {order.pembayaran.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg bg-muted/60 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold tabular-nums text-foreground">
                            {formatCurrency(p.jumlah)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Metode: {p.metode} &bull; {formatDate(p.tanggal)}
                          </p>
                        </div>
                        <Badge variant="ready" className="text-[10px]">
                          Diterima
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Tahapan Pengerjaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2 text-xs">
              {order.tahapan.map((t: any) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-lg border border-border flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-muted flex items-center justify-center font-bold text-[10px] tabular-nums">
                      {t.urutan}
                    </span>
                    <span className="font-medium text-foreground">{t.nama}</span>
                  </div>
                  <Badge
                    variant={
                      t.status === "selesai"
                        ? "ready"
                        : t.status === "berjalan"
                        ? "progress"
                        : "pending"
                    }
                    className="text-[10px]"
                  >
                    {t.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Catat Pembayaran (shadcn Dialog) */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Catat uang muka (DP) atau pelunasan untuk pesanan{" "}
              <span className="font-mono font-semibold text-foreground">
                {order.kode_pesanan}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            {paymentFormError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">
                  {paymentFormError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="payment-amount" className="text-xs font-semibold">
                Nominal Pembayaran (Rp)
              </Label>
              <Input
                id="payment-amount"
                type="number"
                required
                min="1"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Maks sisa tagihan: ${sisaTagihan}`}
                className="font-mono tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Metode Pembayaran</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) =>
                  setPaymentMethod(val as MetodePembayaran)
                }
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MetodePembayaran.tunai}>
                    Tunai (Cash)
                  </SelectItem>
                  <SelectItem value={MetodePembayaran.transfer}>
                    Transfer Bank
                  </SelectItem>
                  <SelectItem value={MetodePembayaran.QRIS}>QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmittingPayment}>
                {isSubmittingPayment ? "Menyimpan..." : "Simpan Pembayaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
