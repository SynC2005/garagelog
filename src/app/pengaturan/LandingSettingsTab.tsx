"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Plus,
  Save,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_LANDING_SETTINGS,
  type CustomerReviewItem,
  type LandingSettingsData,
} from "@/lib/landingDefaults";
import {
  createCustomerReviewAction,
  deleteCustomerReviewAction,
  reorderCustomerReviewAction,
  toggleCustomerReviewVisibilityAction,
  updateCustomerReviewAction,
  updateLandingSettingsAction,
} from "@/server/api/pengaturan/pengaturanApi";

interface LandingSettingsTabProps {
  initialSettings: LandingSettingsData;
  initialReviews: CustomerReviewItem[];
  canManage: boolean;
  onNotify: (type: "success" | "error", message: string) => void;
}

interface ReviewFormState {
  nama: string;
  motor: string;
  rating: string;
  komentar: string;
  ditampilkan: boolean;
}

const EMPTY_REVIEW_FORM: ReviewFormState = {
  nama: "",
  motor: "",
  rating: "5",
  komentar: "",
  ditampilkan: true,
};

export function LandingSettingsTab({
  initialSettings,
  initialReviews,
  canManage,
  onNotify,
}: LandingSettingsTabProps) {
  const router = useRouter();
  const [settings, setSettings] =
    React.useState<LandingSettingsData>(initialSettings);
  const [reviews, setReviews] =
    React.useState<CustomerReviewItem[]>(initialReviews);
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [editingReviewId, setEditingReviewId] = React.useState<number | null>(
    null
  );
  const [reviewForm, setReviewForm] =
    React.useState<ReviewFormState>(EMPTY_REVIEW_FORM);
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);
  const [confirmDeleteReview, setConfirmDeleteReview] =
    React.useState<CustomerReviewItem | null>(null);
  const [isDeletingReview, setIsDeletingReview] = React.useState(false);

  const [prevInitialSettings, setPrevInitialSettings] =
    React.useState(initialSettings);
  if (prevInitialSettings !== initialSettings) {
    setPrevInitialSettings(initialSettings);
    setSettings(initialSettings);
  }

  const [prevInitialReviews, setPrevInitialReviews] =
    React.useState(initialReviews);
  if (prevInitialReviews !== initialReviews) {
    setPrevInitialReviews(initialReviews);
    setReviews(initialReviews);
  }

  const visibleCount = reviews.filter((r) => r.ditampilkan).length;

  const handleSaveLandingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || isSavingSettings) return;

    setIsSavingSettings(true);
    const res = await updateLandingSettingsAction(settings);
    setIsSavingSettings(false);

    if (res.success && res.data) {
      setSettings(res.data);
      onNotify(
        "success",
        "Pengaturan landing page, logo web, dan profil pemilik berhasil disimpan."
      );
      router.refresh();
    } else {
      onNotify("error", res.error || "Gagal menyimpan pengaturan landing page.");
    }
  };

  const openCreateReview = () => {
    setEditingReviewId(null);
    setReviewForm(EMPTY_REVIEW_FORM);
    setReviewDialogOpen(true);
  };

  const openEditReview = (item: CustomerReviewItem) => {
    setEditingReviewId(item.id);
    setReviewForm({
      nama: item.nama,
      motor: item.motor,
      rating: String(item.rating),
      komentar: item.komentar,
      ditampilkan: item.ditampilkan,
    });
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || isSubmittingReview) return;

    setIsSubmittingReview(true);
    const payload = {
      nama: reviewForm.nama,
      motor: reviewForm.motor,
      rating: Number(reviewForm.rating),
      komentar: reviewForm.komentar,
      ditampilkan: reviewForm.ditampilkan,
    };

    const res =
      editingReviewId !== null
        ? await updateCustomerReviewAction(editingReviewId, payload)
        : await createCustomerReviewAction(payload);
    setIsSubmittingReview(false);

    if (res.success && res.data) {
      const saved = res.data;
      setReviews((prev) =>
        editingReviewId !== null
          ? prev.map((r) => (r.id === saved.id ? saved : r))
          : [...prev, saved]
      );
      setReviewDialogOpen(false);
      onNotify(
        "success",
        editingReviewId !== null
          ? `Ulasan dari ${saved.nama} berhasil diperbarui.`
          : `Ulasan baru dari ${saved.nama} ditambahkan.`
      );
      router.refresh();
    } else {
      onNotify("error", res.error || "Gagal menyimpan ulasan pelanggan.");
    }
  };

  const handleToggleReviewVisibility = async (
    item: CustomerReviewItem,
    checked: boolean
  ) => {
    if (!canManage) return;
    setReviews((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, ditampilkan: checked } : r))
    );
    const res = await toggleCustomerReviewVisibilityAction(item.id, checked);
    if (!res.success) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === item.id ? { ...r, ditampilkan: item.ditampilkan } : r
        )
      );
      onNotify("error", res.error || "Gagal mengubah status tampil ulasan.");
    } else {
      onNotify(
        "success",
        checked
          ? `Ulasan ${item.nama} kini ditampilkan di landing page.`
          : `Ulasan ${item.nama} disembunyikan dari landing page.`
      );
      router.refresh();
    }
  };

  const handleReorderReview = async (id: number, direction: "up" | "down") => {
    if (!canManage) return;
    const res = await reorderCustomerReviewAction(id, direction);
    if (res.success && res.data) {
      setReviews(res.data);
      router.refresh();
    } else {
      onNotify("error", res.error || "Gagal mengubah urutan ulasan.");
    }
  };

  const handleDeleteReview = async () => {
    if (!confirmDeleteReview || isDeletingReview) return;
    setIsDeletingReview(true);
    const res = await deleteCustomerReviewAction(confirmDeleteReview.id);
    setIsDeletingReview(false);

    if (res.success) {
      setReviews((prev) =>
        prev.filter((r) => r.id !== confirmDeleteReview.id)
      );
      onNotify(
        "success",
        `Ulasan dari ${confirmDeleteReview.nama} telah dihapus.`
      );
      setConfirmDeleteReview(null);
      router.refresh();
    } else {
      onNotify("error", res.error || "Gagal menghapus ulasan.");
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Form Identitas Web, Hero Background, dan Profil Pemilik */}
      <form onSubmit={handleSaveLandingSettings} className="space-y-6">
        <Card className="py-0 gap-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2
                className="size-4 text-primary"
                aria-hidden="true"
              />
              <span>Identitas Perusahaan, Logo Web &amp; Background Hero</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Perubahan logo web dan nama perusahaan langsung diterapkan pada
              halaman utama, pelacakan publik, dan sidebar staf.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="landing-company-name"
                  className="text-xs font-semibold"
                >
                  Nama Perusahaan *
                </Label>
                <Input
                  id="landing-company-name"
                  required
                  disabled={!canManage}
                  value={settings.namaPerusahaan}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      namaPerusahaan: e.target.value,
                    }))
                  }
                  placeholder="GarageLog"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="landing-company-tagline"
                  className="text-xs font-semibold"
                >
                  Tagline / Subjudul Bengkel *
                </Label>
                <Input
                  id="landing-company-tagline"
                  required
                  disabled={!canManage}
                  value={settings.taglinePerusahaan}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      taglinePerusahaan: e.target.value,
                    }))
                  }
                  placeholder="Bengkel Modifikasi Motor"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="landing-founded-year"
                  className="text-xs font-semibold"
                >
                  Tahun Berdiri Bengkel *
                </Label>
                <Input
                  id="landing-founded-year"
                  type="number"
                  required
                  min={1950}
                  max={currentYear}
                  disabled={!canManage}
                  value={settings.tahunBerdiri}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      tahunBerdiri: Number(e.target.value) || 2016,
                    }))
                  }
                  className="h-9 text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <ImageUploadField
                id="landing-logo-upload"
                label="Logo Web"
                description="Ditampilkan pada navbar halaman utama, halaman masuk staf, dan header pelacakan."
                value={settings.logoUrl}
                fallbackLabel="Ikon Kunci Bawaan"
                aspect="square"
                maxDimension={512}
                preserveTransparency
                disabled={!canManage}
                resetLabel="Reset Ikon Bawaan"
                onReset={() =>
                  setSettings((prev) => ({ ...prev, logoUrl: null }))
                }
                onChange={(nextUrl) =>
                  setSettings((prev) => ({ ...prev, logoUrl: nextUrl }))
                }
              />

              <ImageUploadField
                id="landing-hero-upload"
                label="Foto Background Hero Page"
                description="Menjadi latar bagian atas landing page. Reset untuk kembali memakai Grid Workshop bawaan."
                value={settings.heroBgUrl}
                fallbackLabel="Grid Workshop Bawaan"
                aspect="video"
                maxDimension={1600}
                disabled={!canManage}
                resetLabel="Gunakan Grid Bawaan"
                onReset={() =>
                  setSettings((prev) => ({ ...prev, heroBgUrl: null }))
                }
                onChange={(nextUrl) =>
                  setSettings((prev) => ({ ...prev, heroBgUrl: nextUrl }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Profil & Kutipan Pemilik Perusahaan */}
        <Card className="py-0 gap-0 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserRound
                className="size-4 text-primary"
                aria-hidden="true"
              />
              <span>Profil &amp; Kata-Kata Pemilik Perusahaan</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ditampilkan pada Flip Card interaktif di bagian Pendiri Bengkel
              pada landing page.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-5">
                <ImageUploadField
                  id="landing-owner-photo"
                  label="Foto Profil Pemilik"
                  description="Tampil pada sisi depan Flip Card profil pendiri."
                  value={settings.pemilikFotoUrl}
                  fallbackLabel="Foto Bawaan"
                  aspect="portrait"
                  maxDimension={900}
                  disabled={!canManage}
                  resetLabel="Reset Foto Bawaan"
                  onReset={() =>
                    setSettings((prev) => ({
                      ...prev,
                      pemilikFotoUrl: DEFAULT_LANDING_SETTINGS.pemilikFotoUrl,
                    }))
                  }
                  onChange={(nextUrl) =>
                    setSettings((prev) => ({
                      ...prev,
                      pemilikFotoUrl:
                        nextUrl ?? DEFAULT_LANDING_SETTINGS.pemilikFotoUrl,
                    }))
                  }
                />
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="landing-owner-name"
                      className="text-xs font-semibold"
                    >
                      Nama Pemilik Perusahaan *
                    </Label>
                    <Input
                      id="landing-owner-name"
                      required
                      disabled={!canManage}
                      value={settings.pemilikNama}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          pemilikNama: e.target.value,
                        }))
                      }
                      placeholder="Pak Hendro"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="landing-owner-role"
                      className="text-xs font-semibold"
                    >
                      Jabatan / Peran *
                    </Label>
                    <Input
                      id="landing-owner-role"
                      required
                      disabled={!canManage}
                      value={settings.pemilikJabatan}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          pemilikJabatan: e.target.value,
                        }))
                      }
                      placeholder="Pemilik & Kepala Mekanik"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="landing-owner-quote"
                    className="text-xs font-semibold"
                  >
                    Kata-Kata Pemilik Perusahaan *
                  </Label>
                  <Textarea
                    id="landing-owner-quote"
                    required
                    rows={4}
                    disabled={!canManage}
                    value={settings.pemilikKutipan}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        pemilikKutipan: e.target.value,
                      }))
                    }
                    placeholder="Tuliskan pesan atau filosofi pendiri bengkel..."
                    className="text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {canManage && (
              <div className="pt-3 border-t border-border flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingSettings}
                  className="text-xs font-semibold"
                >
                  <Save className="size-3.5" aria-hidden="true" />
                  <span>
                    {isSavingSettings
                      ? "Menyimpan..."
                      : "Simpan Pengaturan Landing"}
                  </span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      {/* Pengaturan Review Pelanggan yang Ditampilkan */}
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Star className="size-4 text-amber-500" aria-hidden="true" />
              <span>Pengaturan Review Pelanggan Landing Page</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilih ulasan yang ingin ditampilkan pada folder interaktif di
              halaman utama ({visibleCount} dari {reviews.length} ulasan
              ditampilkan).
            </p>
          </div>
          {canManage && (
            <Button size="xs" type="button" onClick={openCreateReview}>
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Tambah Review</span>
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {reviews.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-xs text-muted-foreground">
              <p>Belum ada ulasan pelanggan tersimpan.</p>
              {canManage && (
                <Button
                  size="xs"
                  variant="outline"
                  type="button"
                  onClick={openCreateReview}
                >
                  Tambah Review Pertama
                </Button>
              )}
            </div>
          ) : (
            <Table className="text-xs">
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="px-4 w-12 text-center">#</TableHead>
                  <TableHead className="px-4">Pelanggan &amp; Motor</TableHead>
                  <TableHead className="px-4 text-center w-24">
                    Rating
                  </TableHead>
                  <TableHead className="px-4">Komentar</TableHead>
                  <TableHead className="px-4 text-center w-28">
                    Tampilkan
                  </TableHead>
                  {canManage && (
                    <TableHead className="px-4 text-center w-44">
                      Aksi &amp; Urutan
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((rev, idx) => (
                  <TableRow key={rev.id}>
                    <TableCell className="px-4 py-3 text-center font-mono text-muted-foreground tabular-nums">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {rev.nama}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {rev.motor}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge
                        variant="secondary"
                        className="gap-1 tabular-nums text-[11px]"
                      >
                        <Star
                          className="size-3 fill-amber-500 text-amber-500"
                          aria-hidden="true"
                        />
                        <span>{rev.rating.toFixed(1)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 max-w-md">
                      <p className="text-foreground/90 line-clamp-2 leading-relaxed">
                        &ldquo;{rev.komentar}&rdquo;
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={rev.ditampilkan}
                          disabled={!canManage}
                          aria-label={`Tampilkan review ${rev.nama} di landing page`}
                          onCheckedChange={(checked) =>
                            handleToggleReviewVisibility(rev, checked)
                          }
                        />
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => openEditReview(rev)}
                          >
                            Ubah
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            disabled={idx === 0}
                            onClick={() => handleReorderReview(rev.id, "up")}
                            aria-label={`Naikkan urutan ulasan ${rev.nama}`}
                          >
                            <ArrowUp className="size-3" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-xs"
                            disabled={idx === reviews.length - 1}
                            onClick={() => handleReorderReview(rev.id, "down")}
                            aria-label={`Turunkan urutan ulasan ${rev.nama}`}
                          >
                            <ArrowDown className="size-3" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setConfirmDeleteReview(rev)}
                            aria-label={`Hapus ulasan ${rev.nama}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Tambah / Ubah Review */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingReviewId !== null
                ? "Ubah Ulasan Pelanggan"
                : "Tambah Ulasan Pelanggan"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ulasan aktif akan ditampilkan di folder testimoni halaman utama.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="review-nama" className="text-xs font-semibold">
                Nama Pelanggan *
              </Label>
              <Input
                id="review-nama"
                required
                value={reviewForm.nama}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, nama: e.target.value }))
                }
                placeholder="Misal: Budi Santoso"
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="review-motor" className="text-xs font-semibold">
                  Motor Pelanggan *
                </Label>
                <Input
                  id="review-motor"
                  required
                  value={reviewForm.motor}
                  onChange={(e) =>
                    setReviewForm((prev) => ({
                      ...prev,
                      motor: e.target.value,
                    }))
                  }
                  placeholder="Yamaha Scorpio 225"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="review-rating"
                  className="text-xs font-semibold"
                >
                  Rating *
                </Label>
                <Select
                  value={reviewForm.rating}
                  onValueChange={(val) =>
                    setReviewForm((prev) => ({ ...prev, rating: val }))
                  }
                >
                  <SelectTrigger id="review-rating" className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5.0 — Sangat Puas</SelectItem>
                    <SelectItem value="4">4.0 — Puas</SelectItem>
                    <SelectItem value="3">3.0 — Cukup</SelectItem>
                    <SelectItem value="2">2.0 — Kurang</SelectItem>
                    <SelectItem value="1">1.0 — Buruk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="review-komentar"
                className="text-xs font-semibold"
              >
                Komentar Pelanggan *
              </Label>
              <Textarea
                id="review-komentar"
                required
                rows={3}
                value={reviewForm.komentar}
                onChange={(e) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    komentar: e.target.value,
                  }))
                }
                placeholder="Tulis pengalaman pelanggan..."
                className="text-xs"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <Checkbox
                checked={reviewForm.ditampilkan}
                onCheckedChange={(checked) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    ditampilkan: Boolean(checked),
                  }))
                }
              />
              <span className="text-xs font-medium text-foreground">
                Tampilkan langsung di landing page
              </span>
            </label>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingReview}
                className="text-xs font-semibold"
              >
                {isSubmittingReview ? "Menyimpan..." : "Simpan Ulasan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus Ulasan */}
      <Dialog
        open={Boolean(confirmDeleteReview)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteReview(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Hapus Ulasan Pelanggan?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ulasan dari{" "}
              <strong className="text-foreground">
                {confirmDeleteReview?.nama}
              </strong>{" "}
              akan dihapus permanen dari daftar testimoni bengkel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteReview(null)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeletingReview}
              onClick={handleDeleteReview}
              className="text-xs font-semibold"
            >
              {isDeletingReview ? "Menghapus..." : "Hapus Ulasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
