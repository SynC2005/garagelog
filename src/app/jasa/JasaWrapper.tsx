"use client";

import * as React from "react";
import { Plus, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  createServiceAction,
  updateServiceAction,
} from "@/server/api/jasa/jasaApi";
import type { Jasa } from "@prisma/client";

interface JasaWrapperProps {
  initialServices: Jasa[];
}

export function JasaWrapper({ initialServices }: JasaWrapperProps) {
  const [services, setServices] = React.useState<Jasa[]>(initialServices);
  const [search, setSearch] = React.useState("");

  // Floating Window (Dialog) State
  const [showDialog, setShowDialog] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = React.useState({
    id: 0,
    nama: "",
    deskripsi: "",
    hargaDasar: 500000,
  });

  const filteredServices = services.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      (s.deskripsi && s.deskripsi.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setIsEditing(false);
    setModalError(null);
    setForm({ id: 0, nama: "", deskripsi: "", hargaDasar: 500000 });
    setShowDialog(true);
  };

  const handleOpenEdit = (service: Jasa) => {
    setIsEditing(true);
    setModalError(null);
    setForm({
      id: service.id,
      nama: service.nama,
      deskripsi: service.deskripsi || "",
      hargaDasar: Number(service.harga_dasar),
    });
    setShowDialog(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!form.nama.trim()) {
      setModalError("Nama jasa wajib diisi.");
      return;
    }
    if (form.hargaDasar < 0 || Number.isNaN(Number(form.hargaDasar))) {
      setModalError("Harga dasar tidak boleh kurang dari 0.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing) {
        const res = await updateServiceAction(form.id, {
          nama: form.nama.trim(),
          deskripsi: form.deskripsi.trim() || undefined,
          hargaDasar: Number(form.hargaDasar),
        });
        if (!res.success || !res.data) {
          setModalError(res.error || "Gagal mengubah jasa.");
          return;
        }
        setServices((prev) =>
          prev
            .map((item) => (item.id === form.id ? res.data : item))
            .sort((a, b) => a.nama.localeCompare(b.nama))
        );
        const msg = `Data jasa "${res.data.nama}" berhasil diperbarui!`;
        toast.success(msg);
        setFeedback({ type: "success", text: msg });
      } else {
        const res = await createServiceAction({
          nama: form.nama.trim(),
          deskripsi: form.deskripsi.trim() || undefined,
          hargaDasar: Number(form.hargaDasar),
        });
        if (!res.success || !res.data) {
          setModalError(res.error || "Gagal menambah jasa baru.");
          return;
        }
        setServices((prev) =>
          [...prev, res.data].sort((a, b) => a.nama.localeCompare(b.nama))
        );
        const msg = `Paket jasa "${res.data.nama}" berhasil ditambahkan!`;
        toast.success(msg);
        setFeedback({ type: "success", text: msg });
      }

      setShowDialog(false);
      setForm({ id: 0, nama: "", deskripsi: "", hargaDasar: 500000 });
      setIsEditing(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setModalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Katalog Jasa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Katalog paket modifikasi dan tarif harga dasar jasa pengerjaan bengkel.
          </p>
        </div>

        <Button
          size="sm"
          className="w-full sm:w-auto"
          onClick={handleOpenCreate}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Jasa Baru</span>
        </Button>
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
            {feedback.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabel Daftar Jasa Full Width */}
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 border-b border-border">
          <CardTitle className="text-base font-semibold">
            Daftar Jasa ({services.length})
          </CardTitle>

          <div className="relative w-full sm:w-72">
            <Search
              className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Cari jasa modifikasi"
              placeholder="Cari nama atau deskripsi jasa..."
              className="pl-8 h-8 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4">Nama Jasa</TableHead>
                <TableHead className="px-4">Deskripsi Singkat</TableHead>
                <TableHead className="px-4 text-right">Harga Dasar</TableHead>
                <TableHead className="px-4 text-center w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Tidak ada jasa modifikasi ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="px-4 py-3 font-semibold text-foreground">
                      {s.nama}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground max-w-md truncate">
                      {s.deskripsi || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                      {formatCurrency(Number(s.harga_dasar))}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(s)}
                      >
                        Ubah
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Floating Window: Tambah / Ubah Jasa */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Ubah Jasa Modifikasi" : "Tambah Jasa Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEditing
                ? "Perbarui informasi paket layanan dan tarif dasar jasa bengkel."
                : "Tambahkan layanan modifikasi baru beserta tarif dasar pengerjaannya."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            {modalError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">
                  {modalError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="jasa-nama" className="text-xs font-semibold">
                Nama Jasa
              </Label>
              <Input
                id="jasa-nama"
                type="text"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Contoh: Pengecatan Airbrush Tangki"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jasa-desk" className="text-xs font-semibold">
                Deskripsi Singkat
              </Label>
              <Textarea
                id="jasa-desk"
                rows={4}
                value={form.deskripsi}
                onChange={(e) =>
                  setForm({ ...form, deskripsi: e.target.value })
                }
                placeholder="Deskripsi langkah pengerjaan atau spesifikasi bahan..."
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jasa-harga" className="text-xs font-semibold">
                Harga Dasar (Rp)
              </Label>
              <Input
                id="jasa-harga"
                type="number"
                required
                min="0"
                step="50000"
                value={form.hargaDasar}
                onChange={(e) =>
                  setForm({ ...form, hargaDasar: Number(e.target.value) })
                }
                className="h-9 text-xs font-mono tabular-nums"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setShowDialog(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? "Menyimpan..."
                  : isEditing
                  ? "Perbarui Jasa"
                  : "Simpan Jasa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
