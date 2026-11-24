"use client";

import * as React from "react";
import Link from "next/link";
import {
  Wrench,
  Search,
  UploadCloud,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info,
  Check,
  X,
} from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { addProgressUpdateAction, completeTaskStageAction } from "@/server/api/tugas/tugasApi";
import { JenisPembaruan } from "@prisma/client";

interface TaskStage {
  id: number;
  nama: string;
  wajib_foto: boolean;
  status: string;
}

interface ActiveOrderTask {
  kode: string;
  kendaraan: string;
  nopol: string;
  jasa: string;
  tahapSaatIni: string;
  tahapan: TaskStage[];
}

interface TugasWrapperProps {
  initialTasks?: any[];
}

export function TugasWrapper({ initialTasks }: TugasWrapperProps) {
  // Format initial tasks from DB if provided, otherwise fallback to defaults
  const parsedTasks: ActiveOrderTask[] = React.useMemo(() => {
    if (initialTasks && initialTasks.length > 0) {
      return initialTasks.map((t: any) => ({
        kode: t.kode_pesanan,
        kendaraan: t.kendaraan ? `${t.kendaraan.merek} ${t.kendaraan.model}` : "Motor",
        nopol: t.kendaraan?.nomor_polisi || "-",
        jasa: t.itemJasa?.map((j: any) => j.jasa?.nama).filter(Boolean).join(", ") || "Modifikasi Kustom",
        tahapSaatIni: t.tahapan?.find((s: any) => s.status === "berjalan")?.nama || t.tahapan?.[0]?.nama || "-",
        tahapan: t.tahapan?.map((s: any) => ({
          id: s.id,
          nama: s.nama,
          wajib_foto: s.wajib_foto,
          status: s.status,
        })) || [],
      }));
    }
    return [
      {
        kode: "PSN-9824-7123",
        kendaraan: "Yamaha Scorpio 225",
        nopol: "B 3819 TXB",
        jasa: "Kustom Tangki, Cat Total",
        tahapSaatIni: "Pengecatan",
        tahapan: [
          { id: 1, nama: "Pemeriksaan awal", wajib_foto: true, status: "selesai" },
          { id: 2, nama: "Pembongkaran", wajib_foto: true, status: "selesai" },
          { id: 3, nama: "Pengecatan", wajib_foto: true, status: "berjalan" },
          { id: 4, nama: "Pemasangan komponen", wajib_foto: true, status: "belum" },
          { id: 5, nama: "Pengujian", wajib_foto: false, status: "belum" },
        ],
      },
    ];
  }, [initialTasks]);

  const [activeOrders, setActiveOrders] = React.useState<ActiveOrderTask[]>(parsedTasks);

  React.useEffect(() => {
    setActiveOrders(parsedTasks);
  }, [parsedTasks]);

  const [selectedKode, setSelectedKode] = React.useState("PSN-9824-7123");
  const [search, setSearch] = React.useState("");

  // Update Form State
  const [updateType, setUpdateType] = React.useState<"tahap" | "informasional">("tahap");
  const [selectedStageId, setSelectedStageId] = React.useState<number>(3);
  const [notes, setNotes] = React.useState("Pengecatan epoxy primer telah selesai, lanjut warna dasar.");
  const [uploadedPhotos, setUploadedPhotos] = React.useState<string[]>([
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=60",
  ]);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const selectedOrder = activeOrders.find((o) => o.kode === selectedKode) || activeOrders[0];
  const currentStageObj = selectedOrder?.tahapan.find((s) => s.id === selectedStageId);

  // File upload simulation
  const handleSimulateUpload = () => {
    setUploadedPhotos((prev) => [
      ...prev,
      `https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200&auto=format&fit=crop&q=60`,
    ]);
    setValidationError(null);
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSaveProgress = async (completeStage: boolean) => {
    setValidationError(null);
    setSuccessMessage(null);

    // Rule FR-18: If wajib_foto = true and completing stage, photo is strictly required!
    if (completeStage && currentStageObj?.wajib_foto && uploadedPhotos.length === 0) {
      setValidationError("Tahap ini wajib foto (FR-18). Unggah minimal satu foto sebelum menandai selesai.");
      return;
    }

    if (!notes.trim()) {
      setValidationError("Catatan untuk pelanggan tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);

    const updateRes = await addProgressUpdateAction({
      tahapPesananId: selectedStageId,
      jenis: updateType === "tahap" ? JenisPembaruan.tahap : JenisPembaruan.informasional,
      catatan: notes.trim(),
      dibuatOlehId: 2, // Montir
      fotoUrls: uploadedPhotos,
    });

    if (!updateRes.success) {
      setIsSubmitting(false);
      setValidationError(updateRes.error || "Gagal menyimpan pembaruan progres.");
      return;
    }

    if (completeStage) {
      const finishRes = await completeTaskStageAction(selectedStageId);
      if (!finishRes.success) {
        setIsSubmitting(false);
        setValidationError(finishRes.error || "Gagal menandai tahap selesai.");
        return;
      }
    }

    setIsSubmitting(false);

    setSuccessMessage(
      completeStage
        ? `Tahap "${currentStageObj?.nama}" berhasil diselesaikan dan dicatat ke linimasa!`
        : `Pembaruan berhasil disimpan dan akan tampil di linimasa pelanggan.`
    );

    if (completeStage) {
      setActiveOrders((prev) =>
        prev.map((ord) => {
          if (ord.kode === selectedOrder.kode) {
            return {
              ...ord,
              tahapan: ord.tahapan.map((t) =>
                t.id === selectedStageId ? { ...t, status: "selesai" } : t
              ),
            };
          }
          return ord;
        })
      );
    }

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const filteredOrders = activeOrders.filter(
    (o) =>
      o.kode.toLowerCase().includes(search.toLowerCase()) ||
      o.nopol.toLowerCase().includes(search.toLowerCase()) ||
      o.kendaraan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <StaffLayout activeStaff={{ nama: "Budi Santoso", peran: "Montir" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Tugas Pengerjaan
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Daftar pesanan aktif bengkel untuk montir dan admin. Perbarui tahap dan unggah dokumentasi foto.
        </p>
      </div>

      {/* Grid 2 Kolom Sesuai Wireframe Page 6 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pesanan Aktif List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-sm">Pesanan Aktif ({activeOrders.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              {/* Search box */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kode atau nomor polisi..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                />
              </div>

              {/* Order Cards */}
              <div className="space-y-2">
                {filteredOrders.map((ord) => {
                  const isSelected = ord.kode === selectedKode;
                  return (
                    <button
                      key={ord.kode}
                      type="button"
                      onClick={() => {
                        setSelectedKode(ord.kode);
                        setValidationError(null);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-sm"
                          : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs text-orange-600 dark:text-orange-400">
                          {ord.kode}
                        </span>
                        <Badge variant="progress" className="text-[10px] px-2">
                          {ord.tahapSaatIni}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {ord.kendaraan}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {ord.nopol} &bull; {ord.jasa}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Detail & Form Tambah Pembaruan (8 cols) Sesuai Wireframe Page 6 */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Pesanan Terpilih & Tahap Checklist */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-lg text-orange-600 dark:text-orange-400">
                    {selectedOrder.kode}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {selectedOrder.kendaraan}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Modifikasi: {selectedOrder.jasa}
                </p>
              </div>

              <Link href={`/pesanan/${selectedOrder.kode}`}>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>Lihat rincian</span>
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
                Alur Tahapan Modifikasi:
              </p>
              <div className="space-y-2">
                {selectedOrder.tahapan.map((t, idx) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/40 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-500">{idx + 1}.</span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {t.nama}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">
                        {t.wajib_foto ? "Wajib foto" : "Informasional"}
                      </span>
                      <Badge
                        variant={
                          t.status === "selesai"
                            ? "ready"
                            : t.status === "berjalan"
                            ? "progress"
                            : "completed"
                        }
                        className="text-[10px] px-2 py-0.5"
                      >
                        {t.status === "selesai"
                          ? "Selesai"
                          : t.status === "berjalan"
                          ? "Berjalan"
                          : "Belum"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Tambah Pembaruan Sesuai Wireframe Page 6 */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Tambah Pembaruan Progres</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Alert Feedback */}
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Radio Switch: Pembaruan tahap vs Informasional */}
              <div className="flex items-center gap-6 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="updateType"
                    checked={updateType === "tahap"}
                    onChange={() => setUpdateType("tahap")}
                    className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Pembaruan tahap</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="updateType"
                    checked={updateType === "informasional"}
                    onChange={() => setUpdateType("informasional")}
                    className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Informasional (tanpa foto)</span>
                </label>
              </div>

              {/* Dropdown Tahap */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Pilih Tahap Terkait
                </label>
                <select
                  value={selectedStageId}
                  onChange={(e) => setSelectedStageId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                >
                  {selectedOrder.tahapan.map((t, i) => (
                    <option key={t.id} value={t.id}>
                      {i + 1}. {t.nama} ({t.wajib_foto ? "Wajib Foto" : "Informasional"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Catatan untuk pelanggan */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                  Catatan untuk Pelanggan
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pengecatan lapis pertama selesai, pengeringan ruang oven..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg placeholder:text-slate-400"
                />
              </div>

              {/* Upload Foto (Hanya tampil jika tipe = tahap) */}
              {updateType === "tahap" && (
                <div className="space-y-3 text-xs">
                  <label className="block font-semibold text-slate-700 dark:text-zinc-300">
                    Foto Progres ({uploadedPhotos.length} terunggah)
                  </label>

                  {/* Dropzone area */}
                  <div
                    onClick={handleSimulateUpload}
                    className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-orange-500 dark:hover:border-orange-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-zinc-950/50"
                  >
                    <UploadCloud className="w-8 h-8 mx-auto text-slate-400 dark:text-zinc-500 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-zinc-200">
                      Tarik foto ke sini atau pilih berkas
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      Format: JPG, PNG, WebP. Maksimal 5 MB per foto.
                    </p>
                  </div>

                  {/* Preview uploaded images */}
                  {uploadedPhotos.length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {uploadedPhotos.map((url, i) => (
                        <div
                          key={i}
                          className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 group bg-slate-200 dark:bg-zinc-800"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Progres ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error validation banner (FR-18) */}
                  {validationError && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {currentStageObj?.wajib_foto && uploadedPhotos.length === 0 && !validationError && (
                    <div className="p-2.5 rounded-lg border border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Tahap ini wajib foto. Unggah minimal satu foto sebelum menandai selesai.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  type="button"
                  onClick={() => handleSaveProgress(false)}
                  variant="outline"
                  className="text-xs"
                >
                  <span>Simpan pembaruan</span>
                </Button>

                {updateType === "tahap" && (
                  <Button
                    type="button"
                    onClick={() => handleSaveProgress(true)}
                    className="text-xs font-semibold"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Tandai tahap selesai</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
}

