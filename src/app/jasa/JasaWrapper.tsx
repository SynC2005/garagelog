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
  const [services] = React.useState<Jasa[]>(initialServices);
  const [search, setSearch] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim() || form.hargaDasar < 0) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);

      if (isEditing) {
        const res = await updateServiceAction(form.id, {
          nama: form.nama.trim(),
          deskripsi: form.deskripsi.trim() || undefined,
          hargaDasar: Number(form.hargaDasar),
        });
        if (!res.success) {
          setFeedback({
            type: "error",
            text: res.error || "Gagal mengubah jasa.",
          });
          return;
        }
        toast.success("Data jasa modifikasi berhasil diperbarui!");
        setFeedback({
          type: "success",
          text: "Data jasa modifikasi berhasil diperbarui!",
        });
      } else {
        const res = await createServiceAction({
          nama: form.nama.trim(),
          deskripsi: form.deskripsi.trim() || undefined,
          hargaDasar: Number(form.hargaDasar),
        });
        if (!res.success) {
          setFeedback({
            type: "error",
            text: res.error || "Gagal menambah jasa baru.",
          });
          return;
        }
        toast.success("Paket jasa baru berhasil ditambahkan!");
        setFeedback({
          type: "success",
          text: "Paket jasa baru berhasil ditambahkan!",
        });
      }

      setForm({ id: 0, nama: "", deskripsi: "", hargaDasar: 500000 });
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StaffLayout>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Katalog Jasa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Katalog paket modifikasi dan tarif harga dasar jasa pengerjaan bengkel.
        </p>
      </div>

      {/* Grid 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Tabel Daftar Jasa */}
        <div className="lg:col-span-7">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Daftar Jasa ({services.length})
              </CardTitle>
              <Button
                size="xs"
                onClick={() => {
                  setIsEditing(false);
                  setForm({
                    id: 0,
                    nama: "",
                    deskripsi: "",
                    hargaDasar: 500000,
                  });
                }}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Jasa Baru</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
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
                  <AlertDescription className="text-xs text-current">
                    {feedback.text}
                  </AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <Search
                  className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Cari jasa modifikasi"
                  placeholder="Cari nama jasa modifikasi..."
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/60">
                    <TableRow>
                      <TableHead className="px-3">Nama Jasa</TableHead>
                      <TableHead className="px-3">Deskripsi Singkat</TableHead>
                      <TableHead className="px-3 text-right">
                        Harga Dasar
                      </TableHead>
                      <TableHead className="px-3 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Tidak ada jasa modifikasi ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServices.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="px-3 py-2.5 font-semibold text-foreground">
                            {s.nama}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-muted-foreground max-w-xs truncate">
                            {s.deskripsi || "-"}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-right font-semibold tabular-nums text-primary">
                            {formatCurrency(Number(s.harga_dasar))}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                setIsEditing(true);
                                setForm({
                                  id: s.id,
                                  nama: s.nama,
                                  deskripsi: s.deskripsi || "",
                                  hargaDasar: Number(s.harga_dasar),
                                });
                              }}
                            >
                              Ubah
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Form Tambah/Ubah Jasa */}
        <div className="lg:col-span-5">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                {isEditing ? "Ubah Jasa Modifikasi" : "Tambah Jasa Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
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

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="text-xs"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : isEditing
                      ? "Perbarui Jasa"
                      : "Simpan Jasa"}
                  </Button>
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      className="text-xs"
                      onClick={() => {
                        setIsEditing(false);
                        setForm({
                          id: 0,
                          nama: "",
                          deskripsi: "",
                          hargaDasar: 500000,
                        });
                      }}
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </StaffLayout>
  );
}
