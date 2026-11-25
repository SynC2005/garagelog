"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info,
  Check,
  X,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  addProgressUpdateAction,
  completeTaskStageAction,
} from "@/server/api/tugas/tugasApi";
import { assignOrderMechanicAction } from "@/server/api/pesanan/pesananApi";
import { JenisPembaruan, PeranUser } from "@prisma/client";
import type { FeatureCode } from "@/lib/rbac";

interface TaskStage {
  id: number;
  nama: string;
  wajib_foto: boolean;
  status: string;
}

interface ActiveOrderTask {
  id: number;
  kode: string;
  kendaraan: string;
  nopol: string;
  jasa: string;
  tahapSaatIni: string;
  montirId: number | null;
  montirNama: string | null;
  tahapan: TaskStage[];
}

interface MechanicOption {
  id: number;
  nama: string;
  email: string;
}

interface TugasWrapperProps {
  initialTasks?: any[];
  mechanics?: MechanicOption[];
  canAssignMechanic?: boolean;
  activeStaff?: { nama: string; peran: PeranUser };
  allowedFeatures?: Partial<Record<FeatureCode, boolean>>;
  canManage?: boolean;
}

export function TugasWrapper({
  initialTasks = [],
  mechanics = [],
  canAssignMechanic = false,
  activeStaff,
  allowedFeatures,
  canManage = true,
}: TugasWrapperProps) {
  const parsedTasks: ActiveOrderTask[] = React.useMemo(() => {
    return (initialTasks || []).map((t: any) => ({
      id: t.id,
      kode: t.kode_pesanan,
      kendaraan: t.kendaraan
        ? `${t.kendaraan.merek} ${t.kendaraan.model}`
        : "Motor",
      nopol: t.kendaraan?.nomor_polisi || "-",
      jasa:
        t.itemJasa
          ?.map((j: any) => j.jasa?.nama)
          .filter(Boolean)
          .join(", ") || "Modifikasi Kustom",
      tahapSaatIni:
        t.tahapan?.find((s: any) => s.status === "berjalan")?.nama ||
        t.tahapan?.[0]?.nama ||
        "-",
      montirId: t.montir_id ?? null,
      montirNama: t.montirDitugaskan?.nama ?? null,
      tahapan:
        t.tahapan?.map((s: any) => ({
          id: s.id,
          nama: s.nama,
          wajib_foto: s.wajib_foto,
          status: s.status,
        })) || [],
    }));
  }, [initialTasks]);

  const [activeOrders, setActiveOrders] =
    React.useState<ActiveOrderTask[]>(parsedTasks);

  React.useEffect(() => {
    setActiveOrders(parsedTasks);
  }, [parsedTasks]);

  const [selectedKode, setSelectedKode] = React.useState(
    parsedTasks[0]?.kode || ""
  );
  const [search, setSearch] = React.useState("");
  const [isAssigningMechanic, setIsAssigningMechanic] = React.useState(false);

  const selectedOrder =
    activeOrders.find((o) => o.kode === selectedKode) || activeOrders[0];

  const defaultStageId = React.useMemo(() => {
    const running = selectedOrder?.tahapan.find((s) => s.status === "berjalan");
    return running?.id || selectedOrder?.tahapan[0]?.id || 0;
  }, [selectedOrder]);

  // Update Form State
  const [updateType, setUpdateType] = React.useState<"tahap" | "informasional">(
    "tahap"
  );
  const [selectedStageId, setSelectedStageId] =
    React.useState<number>(defaultStageId);
  const [notes, setNotes] = React.useState(
    "Pengecatan epoxy primer telah selesai, lanjut warna dasar."
  );
  const [uploadedPhotos, setUploadedPhotos] = React.useState<string[]>([
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200&auto=format&fit=crop&q=60",
  ]);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (
      selectedOrder &&
      !selectedOrder.tahapan.some((s) => s.id === selectedStageId)
    ) {
      const running = selectedOrder.tahapan.find(
        (s) => s.status === "berjalan"
      );
      setSelectedStageId(running?.id || selectedOrder.tahapan[0]?.id || 0);
    }
  }, [selectedOrder, selectedStageId]);

  const currentStageObj = selectedOrder?.tahapan.find(
    (s) => s.id === selectedStageId
  );

  const handleAssignMechanic = async (pesananId: number, value: string) => {
    const nextMontirId = value === "none" ? null : Number(value);
    setIsAssigningMechanic(true);
    const res = await assignOrderMechanicAction(pesananId, nextMontirId);
    setIsAssigningMechanic(false);

    if (res.success && res.data) {
      setActiveOrders((prev) =>
        prev.map((ord) =>
          ord.id === pesananId
            ? {
                ...ord,
                montirId: res.data.montir_id,
                montirNama: res.data.montirDitugaskan?.nama || null,
              }
            : ord
        )
      );
      toast.success(
        res.data.montirDitugaskan
          ? `Tugas ${res.data.kode_pesanan} ditugaskan ke ${res.data.montirDitugaskan.nama}.`
          : `Penugasan montir pada tugas ${res.data.kode_pesanan} dilepas.`
      );
    } else {
      toast.error(res.error || "Gagal menugaskan montir.");
    }
  };

  const handleSimulateUpload = () => {
    setUploadedPhotos((prev) => [
      ...prev,
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=200&auto=format&fit=crop&q=60",
    ]);
    setValidationError(null);
  };

  const handleRemovePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProgress = async (completeStage: boolean) => {
    if (!selectedOrder) return;

    setValidationError(null);
    setSuccessMessage(null);

    if (
      completeStage &&
      currentStageObj?.wajib_foto &&
      uploadedPhotos.length === 0
    ) {
      setValidationError(
        "Tahap ini wajib foto (FR-18). Unggah minimal satu foto sebelum menandai selesai."
      );
      return;
    }

    if (!notes.trim()) {
      setValidationError("Catatan untuk pelanggan tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);

    const updateRes = await addProgressUpdateAction({
      tahapPesananId: selectedStageId,
      jenis:
        updateType === "tahap"
          ? JenisPembaruan.tahap
          : JenisPembaruan.informasional,
      catatan: notes.trim(),
      dibuatOlehId: 2,
      fotoUrls: uploadedPhotos,
    });

    if (!updateRes.success) {
      setIsSubmitting(false);
      setValidationError(
        updateRes.error || "Gagal menyimpan pembaruan progres."
      );
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

    const msg = completeStage
      ? `Tahap "${currentStageObj?.nama}" berhasil diselesaikan dan dicatat ke linimasa.`
      : "Pembaruan berhasil disimpan dan akan tampil di linimasa pelanggan.";

    setSuccessMessage(msg);
    toast.success(msg);

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

  const filteredOrders = activeOrders.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.kode.toLowerCase().includes(q) ||
      o.nopol.toLowerCase().includes(q) ||
      o.kendaraan.toLowerCase().includes(q) ||
      (o.montirNama && o.montirNama.toLowerCase().includes(q))
    );
  });

  return (
    <StaffLayout
      activeStaff={activeStaff || { nama: "Budi Montir", peran: "Montir" }}
      allowedFeatures={allowedFeatures}
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tugas Pengerjaan
          </h1>
          {!canManage && (
            <Badge variant="outline" className="text-[11px]">
              Mode Baca Saja
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {activeStaff?.peran === PeranUser.Montir
            ? "Menampilkan pesanan aktif yang ditugaskan kepada Anda. Perbarui tahap dan unggah dokumentasi foto."
            : "Daftar pesanan aktif bengkel dan penugasan montir pelaksana."}
        </p>
      </div>

      {activeOrders.length === 0 || !selectedOrder ? (
        <Card className="py-0 gap-0">
          <CardContent className="p-10 text-center space-y-3 max-w-md mx-auto">
            <div className="size-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Wrench className="size-6" aria-hidden="true" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              {activeStaff?.peran === PeranUser.Montir
                ? "Belum ada tugas yang ditugaskan kepada Anda"
                : "Belum ada pesanan aktif"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeStaff?.peran === PeranUser.Montir
                ? "Admin perlu menugaskan pesanan berstatus Dikerjakan atau Siap Diambil kepada akun Anda terlebih dahulu."
                : "Buat dan setujui pesanan terlebih dahulu agar muncul di antrean pengerjaan."}
            </p>
            {allowedFeatures?.pesanan && (
              <div className="pt-2">
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <Link href="/pesanan">Lihat Daftar Pesanan</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri: Pesanan Aktif List (4 cols) */}
          <div className="lg:col-span-4">
            <Card className="py-0 gap-0">
              <CardHeader className="p-4 border-b border-border">
                <CardTitle className="text-sm font-semibold">
                  Pesanan Aktif ({activeOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="relative">
                  <Search
                    className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <Input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Cari tugas pesanan"
                    placeholder="Cari kode atau nomor polisi..."
                    className="pl-8 h-8 text-xs"
                  />
                </div>

                {filteredOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Tidak ada tugas yang cocok dengan pencarian &ldquo;{search}&rdquo;.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredOrders.map((ord) => {
                      const isSelected = ord.kode === selectedOrder.kode;
                      return (
                        <button
                          key={ord.kode}
                          type="button"
                          onClick={() => {
                            setSelectedKode(ord.kode);
                            const running = ord.tahapan.find(
                              (s) => s.status === "berjalan"
                            );
                            setSelectedStageId(
                              running?.id || ord.tahapan[0]?.id || 0
                            );
                            setValidationError(null);
                          }}
                          className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            isSelected
                              ? "border-primary bg-accent/60"
                              : "border-border bg-card hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono font-bold text-xs text-primary">
                              {ord.kode}
                            </span>
                            <Badge variant="progress" className="text-[10px]">
                              {ord.tahapSaatIni}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-foreground truncate">
                            {ord.kendaraan}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                            {ord.nopol} &bull; {ord.jasa}
                          </p>
                          <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-muted-foreground">Montir:</span>
                            <Badge
                              variant={ord.montirNama ? "secondary" : "outline"}
                              className="text-[10px] font-medium"
                            >
                              {ord.montirNama || "Belum ditugaskan"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kolom Kanan: Detail & Form Tambah Pembaruan (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="py-0 gap-0">
              <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 border-b border-border">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-lg text-primary">
                      {selectedOrder.kode}
                    </span>
                    <span className="text-xs text-muted-foreground">&bull;</span>
                    <span className="font-bold text-foreground text-sm">
                      {selectedOrder.kendaraan}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Modifikasi: {selectedOrder.jasa}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {canAssignMechanic ? (
                    <Select
                      value={
                        selectedOrder.montirId
                          ? String(selectedOrder.montirId)
                          : "none"
                      }
                      disabled={isAssigningMechanic}
                      onValueChange={(val) =>
                        handleAssignMechanic(selectedOrder.id, val)
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-xs w-48"
                        aria-label="Tugaskan montir untuk tugas ini"
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
                  ) : (
                    <Badge variant="progress" className="text-xs gap-1.5">
                      <Wrench className="size-3" aria-hidden="true" />
                      <span>
                        {selectedOrder.montirNama || "Belum ditugaskan"}
                      </span>
                    </Badge>
                  )}

                  {allowedFeatures?.pesanan && (
                    <Button asChild variant="outline" size="xs">
                      <Link href={`/pesanan/${selectedOrder.kode}`}>
                        <Eye className="size-3.5" aria-hidden="true" />
                        <span>Lihat rincian</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground mb-2">
                  Alur Tahapan Modifikasi:
                </p>
                <div className="space-y-2">
                  {selectedOrder.tahapan.map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold tabular-nums text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <span className="font-medium text-foreground">
                          {t.nama}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
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
                          className="text-[10px]"
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

            {/* Form Tambah Pembaruan */}
            {canManage && (
              <Card className="py-0 gap-0">
                <CardHeader className="p-4 sm:p-5 border-b border-border">
                  <CardTitle className="text-base font-semibold">
                    Tambah Pembaruan Progres
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-5">
                  {successMessage && (
                    <Alert className="bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                      <AlertDescription className="text-xs text-current">
                        {successMessage}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Radio Switch */}
                  <RadioGroup
                    value={updateType}
                    onValueChange={(val) =>
                      setUpdateType(val as "tahap" | "informasional")
                    }
                    className="flex flex-wrap items-center gap-6"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="tahap" id="type-tahap" />
                      <Label
                        htmlFor="type-tahap"
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Pembaruan tahap
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem
                        value="informasional"
                        id="type-informasional"
                      />
                      <Label
                        htmlFor="type-informasional"
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Informasional (tanpa foto)
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Dropdown Tahap */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Pilih Tahap Terkait
                    </Label>
                    <Select
                      value={selectedStageId ? String(selectedStageId) : ""}
                      onValueChange={(val) => setSelectedStageId(Number(val))}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Pilih tahapan" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedOrder.tahapan.map((t, i) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {i + 1}. {t.nama} (
                            {t.wajib_foto ? "Wajib Foto" : "Informasional"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catatan untuk pelanggan */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task-notes" className="text-xs font-semibold">
                      Catatan untuk Pelanggan
                    </Label>
                    <Textarea
                      id="task-notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Pengecatan lapis pertama selesai, pengeringan ruang oven..."
                      className="text-xs"
                    />
                  </div>

                  {/* Upload Foto */}
                  {updateType === "tahap" && (
                    <div className="space-y-3 text-xs">
                      <Label className="text-xs font-semibold">
                        Foto Progres ({uploadedPhotos.length} terunggah)
                      </Label>

                      <button
                        type="button"
                        onClick={handleSimulateUpload}
                        className="w-full border-2 border-dashed border-border hover:border-primary rounded-lg p-6 text-center cursor-pointer transition-colors bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <UploadCloud
                          className="size-8 mx-auto text-muted-foreground mb-2"
                          aria-hidden="true"
                        />
                        <p className="font-semibold text-foreground">
                          Tarik foto ke sini atau pilih berkas
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Format: JPG, PNG, WebP. Maksimal 5 MB per foto.
                        </p>
                      </button>

                      {uploadedPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {uploadedPhotos.map((url, i) => (
                            <div
                              key={i}
                              className="relative size-20 rounded-lg overflow-hidden border border-border group bg-muted"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt={`Progres ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                size="icon-xs"
                                variant="destructive"
                                onClick={() => handleRemovePhoto(i)}
                                aria-label={`Hapus foto progres ${i + 1}`}
                                className="absolute top-1 right-1 size-5 rounded-full"
                              >
                                <X className="size-3" aria-hidden="true" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {validationError && (
                        <Alert variant="destructive">
                          <AlertCircle className="size-4" />
                          <AlertDescription className="text-xs">
                            {validationError}
                          </AlertDescription>
                        </Alert>
                      )}

                      {currentStageObj?.wajib_foto &&
                        uploadedPhotos.length === 0 &&
                        !validationError && (
                          <Alert className="border-dashed border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                            <Info className="size-4 text-amber-600 dark:text-amber-400" />
                            <AlertDescription className="text-[11px] text-current">
                              Tahap ini wajib foto. Unggah minimal satu foto sebelum
                              menandai selesai.
                            </AlertDescription>
                          </Alert>
                        )}
                    </div>
                  )}

                  <Separator />

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleSaveProgress(false)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <span>Simpan pembaruan</span>
                    </Button>

                    {updateType === "tahap" && (
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSaveProgress(true)}
                        size="sm"
                        className="text-xs font-semibold"
                      >
                        <Check className="size-3.5" aria-hidden="true" />
                        <span>Tandai tahap selesai</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
