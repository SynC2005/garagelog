"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Bike,
  Wrench,
  Package,
  ListOrdered,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatCurrency";
import { createOrderAction } from "@/server/api/pesanan/pesananApi";

interface CustomerWithVehicles {
  id: number;
  nama: string;
  telepon: string;
  kendaraan: {
    id: number;
    merek: string;
    model: string;
    tahun: number;
    nomor_polisi: string;
  }[];
}

interface ServiceItem {
  id: number;
  nama: string;
  harga_dasar: number;
}

interface SparePartItem {
  id: number;
  nama: string;
  SKU: string;
  harga_jual: number;
  stok: number;
}

interface StageTemplateItem {
  id: number;
  urutan: number;
  nama: string;
  wajib_foto: boolean;
}

interface BuatPesananWrapperProps {
  customers: CustomerWithVehicles[];
  servicesCatalog: ServiceItem[];
  sparePartsCatalog: SparePartItem[];
  stageTemplates: StageTemplateItem[];
}

export function BuatPesananWrapper({
  customers,
  servicesCatalog,
  sparePartsCatalog,
  stageTemplates,
}: BuatPesananWrapperProps) {
  const router = useRouter();

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number>(
    customers.length > 0 ? customers[0].id : 0
  );
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  const [selectedVehicleId, setSelectedVehicleId] = React.useState<number>(
    currentCustomer && currentCustomer.kendaraan.length > 0
      ? currentCustomer.kendaraan[0].id
      : 0
  );

  React.useEffect(() => {
    if (currentCustomer && currentCustomer.kendaraan.length > 0) {
      setSelectedVehicleId(currentCustomer.kendaraan[0].id);
    } else {
      setSelectedVehicleId(0);
    }
  }, [selectedCustomerId, currentCustomer]);

  const [selectedServices, setSelectedServices] = React.useState<number[]>(
    servicesCatalog.slice(0, 2).map((s) => s.id)
  );

  const [orderParts, setOrderParts] = React.useState<
    { sukuCadangId: number; nama: string; jumlah: number; harga: number }[]
  >([]);

  const [selectedPartId, setSelectedPartId] = React.useState<number>(
    sparePartsCatalog.length > 0 ? sparePartsCatalog[0].id : 0
  );
  const [selectedPartQty, setSelectedPartQty] = React.useState<string>("1");

  const [stages, setStages] = React.useState(
    stageTemplates.map((stg) => ({ ...stg, selected: true }))
  );

  const defaultFinishDate = new Date();
  defaultFinishDate.setDate(defaultFinishDate.getDate() + 14);
  const [perkiraanSelesai, setPerkiraanSelesai] = React.useState(
    defaultFinishDate.toISOString().split("T")[0]
  );
  const [catatan, setCatatan] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAddPart = () => {
    const part = sparePartsCatalog.find((p) => p.id === selectedPartId);
    if (!part) return;

    const qty = Number(selectedPartQty);
    if (isNaN(qty) || qty <= 0) return;

    const exists = orderParts.find((p) => p.sukuCadangId === selectedPartId);
    if (exists) {
      setOrderParts((prev) =>
        prev.map((p) =>
          p.sukuCadangId === selectedPartId ? { ...p, jumlah: p.jumlah + qty } : p
        )
      );
    } else {
      setOrderParts((prev) => [
        ...prev,
        {
          sukuCadangId: part.id,
          nama: part.nama,
          jumlah: qty,
          harga: part.harga_jual,
        },
      ]);
    }
  };

  const handleRemovePart = (partId: number) => {
    setOrderParts((prev) => prev.filter((p) => p.sukuCadangId !== partId));
  };

  const toggleStage = (id: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  // Subtotal calculations
  const subtotalJasa = selectedServices.reduce((sum, sId) => {
    const s = servicesCatalog.find((item) => item.id === sId);
    return sum + (s?.harga_dasar || 0);
  }, 0);

  const subtotalParts = orderParts.reduce(
    (sum, p) => sum + p.harga * p.jumlah,
    0
  );

  const totalEstimasi = subtotalJasa + subtotalParts;

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!selectedVehicleId) {
      setErrorMessage("Pelanggan ini belum memiliki kendaraan terdaftar. Daftarkan kendaraan di menu Pelanggan terlebih dahulu.");
      return;
    }
    if (selectedServices.length === 0 && orderParts.length === 0) {
      setErrorMessage("Pilih minimal satu layanan jasa atau satu suku cadang untuk pesanan ini.");
      return;
    }

    const activeStageIds = stages.filter((s) => s.selected).map((s) => s.id);
    if (activeStageIds.length === 0) {
      setErrorMessage("Pilih minimal satu tahapan pengerjaan untuk pesanan ini.");
      return;
    }

    setIsSubmitting(true);

    const res = await createOrderAction({
      pelangganId: selectedCustomerId,
      kendaraanId: selectedVehicleId,
      dibuatOlehId: 1, // Admin bengkel
      perkiraanSelesai: perkiraanSelesai,
      catatan: catatan.trim(),
      jasaIds: selectedServices,
      sukuCadang: orderParts.map((p) => ({
        sukuCadangId: p.sukuCadangId,
        jumlah: p.jumlah,
        harga: p.harga,
      })),
      tahapIds: activeStageIds,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      router.push(`/pesanan/${res.data.kode_pesanan}`);
    } else {
      setErrorMessage(res.error || "Gagal membuat pesanan baru.");
    }
  };

  return (
    <StaffLayout>
      {/* Header Form */}
      <div className="flex items-center gap-3">
        <Link href="/pesanan">
          <Button variant="outline" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Buat Pesanan Modifikasi
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Formulir pendaftaran pelanggan, penentuan modifikasi, suku cadang, dan template tahapan.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Form Input (8 kolom) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Pelanggan & Kendaraan */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-base">1. Pelanggan & Kendaraan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1.5">Pilih Pelanggan</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama} ({c.telepon})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1.5">Pilih Kendaraan Motor</label>
                  {currentCustomer && currentCustomer.kendaraan.length > 0 ? (
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                    >
                      {currentCustomer.kendaraan.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.merek} {v.model} ({v.nomor_polisi}) - {v.tahun}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 border border-dashed border-rose-300 rounded-lg text-rose-600 dark:text-rose-400 text-[11px]">
                      Belum ada motor terdaftar untuk pelanggan ini.{" "}
                      <Link href="/pelanggan" className="underline font-bold">
                        Tambah di Pelanggan &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Paket Modifikasi / Layanan Jasa */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-base">2. Paket Jasa & Pengerjaan Modifikasi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {servicesCatalog.map((service) => (
                  <label
                    key={service.id}
                    className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {service.nama}
                      </span>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-zinc-300">
                      {formatCurrency(service.harga_dasar)}
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Suku Cadang & Komponen Tambahan */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-base">3. Suku Cadang & Komponen Kustom</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {/* Tambah komponen */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <select
                    value={selectedPartId}
                    onChange={(e) => setSelectedPartId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  >
                    {sparePartsCatalog.map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.nama} (Stok: {part.stok}) — {formatCurrency(part.harga_jual)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-24">
                  <input
                    type="number"
                    min="1"
                    value={selectedPartQty}
                    onChange={(e) => setSelectedPartQty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-mono"
                    placeholder="Jml"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPart}
                  className="w-full sm:w-auto h-9"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Tambah</span>
                </Button>
              </div>

              {/* List Suku Cadang yang Dipilih */}
              {orderParts.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2 px-3">Komponen</th>
                        <th className="py-2 px-3 text-center">Jml</th>
                        <th className="py-2 px-3 text-right">Harga</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                        <th className="py-2 px-3 text-center">Hapus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {orderParts.map((p) => (
                        <tr key={p.sukuCadangId}>
                          <td className="py-2 px-3 font-medium">{p.nama}</td>
                          <td className="py-2 px-3 text-center font-mono">{p.jumlah}</td>
                          <td className="py-2 px-3 text-right">{formatCurrency(p.harga)}</td>
                          <td className="py-2 px-3 text-right font-bold">
                            {formatCurrency(p.harga * p.jumlah)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePart(p.sukuCadangId)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Template Tahapan Pengerjaan */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-orange-500" />
                <CardTitle className="text-base">4. Template Tahapan Pengerjaan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-2 text-xs">
              <p className="text-slate-500 dark:text-zinc-400 mb-2">
                Pilih tahapan alur modifikasi yang akan dijalankan oleh montir:
              </p>
              <div className="space-y-1.5">
                {stages.map((stg) => (
                  <label
                    key={stg.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={stg.selected}
                        onChange={() => toggleStage(stg.id)}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {stg.urutan}. {stg.nama}
                      </span>
                    </div>
                    {stg.wajib_foto && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 px-2 py-0.5 rounded font-semibold">
                        Wajib Foto
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Samping: Ringkasan Biaya & Submit (4 kolom) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Ringkasan Estimasi Biaya</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Subtotal Jasa ({selectedServices.length} item)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(subtotalJasa)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>Subtotal Suku Cadang ({orderParts.length} item)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(subtotalParts)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Total Estimasi:
                </span>
                <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalEstimasi)}
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="font-semibold block">Perkiraan Tanggal Selesai</label>
                <input
                  type="date"
                  required
                  value={perkiraanSelesai}
                  onChange={(e) => setPerkiraanSelesai(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block">Catatan / Konsep Kustom</label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan konsep motor, warna yang diinginkan, dsb..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 text-xs font-semibold mt-4"
              >
                {isSubmitting ? "Menyimpan Pesanan..." : "Buat Pesanan Modifikasi"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </StaffLayout>
  );
}
