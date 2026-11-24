"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Printer,
  CheckCircle,
  Plus,
  CreditCard,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate, formatDateTime } from "@/utils/formatDate";
import { approveOrderAction, recordPaymentAction } from "@/server/api/pesanan/pesananApi";
import { MetodePembayaran, StatusPesanan } from "@prisma/client";

interface DetailPesananWrapperProps {
  order: any;
}

export function DetailPesananWrapper({ order: initialOrder }: DetailPesananWrapperProps) {
  const [order, setOrder] = React.useState<any>(initialOrder);
  const [copied, setCopied] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

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
  const [paymentMethod, setPaymentMethod] = React.useState<MetodePembayaran>(MetodePembayaran.transfer);
  const [isSubmittingPayment, setIsSubmittingPayment] = React.useState(false);

  // Approval Loading State
  const [isApproving, setIsApproving] = React.useState(false);

  // Calculations
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
    } else {
      showNotification("error", res.error || "Gagal menyetujui pesanan.");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Masukkan nominal pembayaran yang valid!");
      return;
    }

    setIsSubmittingPayment(true);
    const res = await recordPaymentAction({
      pesananId: order.id,
      jumlah: amount,
      metode: paymentMethod,
      dicatatOlehId: 1, // Admin bengkel
    });
    setIsSubmittingPayment(false);

    if (res.success && res.data) {
      setOrder((prev: any) => ({
        ...prev,
        pembayaran: [res.data, ...prev.pembayaran],
      }));
      setShowPaymentModal(false);
      setPaymentAmount("");
      showNotification("success", `Pembayaran sebesar ${formatCurrency(amount)} berhasil dicatat!`);
    } else {
      alert(res.error || "Gagal mencatat pembayaran.");
    }
  };

  return (
    <StaffLayout>
      {/* Header Halaman Sesuai Wireframe Page 4 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Link href="/pesanan">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white">
              {order.kode_pesanan}
            </h1>
            <Badge
              variant={
                order.status === StatusPesanan.Selesai
                  ? "ready"
                  : order.status === StatusPesanan.Dikerjakan
                  ? "progress"
                  : order.status === StatusPesanan.Siap_Diambil
                  ? "ready"
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
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="text-xs">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1" />
            )}
            <span>{copied ? "Tautan Disalin!" : "Salin tautan pelacakan"}</span>
          </Button>

          <Link href={`/pesanan/${order.kode_pesanan}/nota`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Cetak nota</span>
            </Button>
          </Link>

          {order.status === StatusPesanan.Menunggu_Persetujuan && (
            <Button
              size="sm"
              variant="secondary"
              disabled={isApproving}
              className="text-xs"
              onClick={handleApprove}
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
              <span>{isApproving ? "Memproses..." : "Catat persetujuan estimasi"}</span>
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid 2 Kolom Layout Sesuai Wireframe Page 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Ringkasan & Rincian Item (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Ringkasan */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Ringkasan Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 dark:text-zinc-500 font-medium">Pelanggan</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {order.pelanggan?.nama}
                </p>
                <p className="text-slate-600 dark:text-zinc-300 mt-0.5">
                  {order.pelanggan?.telepon}
                </p>
              </div>

              <div>
                <p className="text-slate-400 dark:text-zinc-500 font-medium">Kendaraan</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {order.kendaraan?.merek} {order.kendaraan?.model}
                </p>
                <p className="text-slate-600 dark:text-zinc-300 mt-0.5">
                  Tahun {order.kendaraan?.tahun} &bull; {order.kendaraan?.nomor_polisi}
                </p>
              </div>

              <div>
                <p className="text-slate-400 dark:text-zinc-500 font-medium">Dibuat oleh</p>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {order.userPembuat?.nama || "Admin"} &bull; {formatDate(order.created_at)}
                </p>
              </div>

              <div>
                <p className="text-slate-400 dark:text-zinc-500 font-medium">Perkiraan selesai</p>
                <p className="font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                  {formatDate(order.perkiraan_selesai)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Rincian Jasa dan Suku Cadang */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Rincian Jasa dan Suku Cadang</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-4">Item</th>
                      <th className="py-2.5 px-4">Jenis</th>
                      <th className="py-2.5 px-4 text-center">Jml</th>
                      <th className="py-2.5 px-4 text-right">Harga</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {order.itemJasa.map((ij: any) => (
                      <tr key={`jasa-${ij.id}`}>
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                          {ij.jasa?.nama}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 dark:text-zinc-400">Jasa</td>
                        <td className="py-2.5 px-4 text-center font-mono">1</td>
                        <td className="py-2.5 px-4 text-right">{formatCurrency(ij.harga)}</td>
                        <td className="py-2.5 px-4 text-right font-bold">
                          {formatCurrency(ij.harga)}
                        </td>
                      </tr>
                    ))}
                    {order.itemSukuCadang.map((ic: any) => (
                      <tr key={`part-${ic.id}`}>
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                          {ic.sukuCadang?.nama}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 dark:text-zinc-400">
                          Suku cadang
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono">{ic.jumlah}</td>
                        <td className="py-2.5 px-4 text-right">{formatCurrency(ic.harga)}</td>
                        <td className="py-2.5 px-4 text-right font-bold">
                          {formatCurrency(ic.harga * ic.jumlah)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Pembayaran & Linimasa Progres (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Pembayaran */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Pembayaran</CardTitle>
              <Button
                size="sm"
                className="text-xs"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                <span>+ Catat Pembayaran</span>
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="space-y-1.5 pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Total Estimasi</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(totalEstimasi)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Total Terbayar</span>
                  <span className="font-bold">{formatCurrency(totalDibayar)}</span>
                </div>
                <div className="flex justify-between text-orange-600 font-bold">
                  <span>Sisa Tagihan</span>
                  <span>{formatCurrency(sisaTagihan)}</span>
                </div>
              </div>

              {/* Riwayat Pembayaran */}
              <div>
                <p className="font-semibold text-slate-900 dark:text-white mb-2">
                  Riwayat Pembayaran:
                </p>
                {order.pembayaran.length === 0 ? (
                  <p className="text-slate-400 text-xs">Belum ada pembayaran tercatat.</p>
                ) : (
                  <div className="space-y-2">
                    {order.pembayaran.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(p.jumlah)}
                          </p>
                          <p className="text-[10px] text-slate-400">
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

          {/* Tahapan Pengerjaan */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Tahapan Pengerjaan</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="space-y-2">
                {order.tahapan.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px]">
                        {t.urutan}
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">{t.nama}</span>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Catat Pembayaran */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Catat Pembayaran Baru
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Maks sisa tagihan: ${sisaTagihan}`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as MetodePembayaran)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                >
                  <option value={MetodePembayaran.tunai}>Tunai (Cash)</option>
                  <option value={MetodePembayaran.transfer}>Transfer Bank</option>
                  <option value={MetodePembayaran.QRIS}>QRIS</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
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
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
