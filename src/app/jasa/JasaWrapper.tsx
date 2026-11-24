"use client";

import * as React from "react";
import { BookOpen, Plus, Search, Edit2, AlertCircle, CheckCircle2 } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatCurrency";
import { createServiceAction, updateServiceAction } from "@/server/api/jasa/jasaApi";
import type { Jasa } from "@prisma/client";

interface JasaWrapperProps {
  initialServices: Jasa[];
}

export function JasaWrapper({ initialServices }: JasaWrapperProps) {
  const [services, setServices] = React.useState<Jasa[]>(initialServices);
  const [search, setSearch] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

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
          setFeedback({ type: "error", text: res.error || "Gagal mengubah jasa." });
          return;
        }
        setFeedback({ type: "success", text: "Data jasa modifikasi berhasil diperbarui!" });
      } else {
        const res = await createServiceAction({
          nama: form.nama.trim(),
          deskripsi: form.deskripsi.trim() || undefined,
          hargaDasar: Number(form.hargaDasar),
        });
        if (!res.success) {
          setFeedback({ type: "error", text: res.error || "Gagal menambah jasa baru." });
          return;
        }
        setFeedback({ type: "success", text: "Paket jasa baru berhasil ditambahkan!" });
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
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Katalog Jasa
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Katalog paket modifikasi dan tarif harga dasar jasa pengerjaan bengkel.
        </p>
      </div>

      {/* Grid 2 Kolom Sesuai Wireframe Page 8 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Tabel Daftar Jasa (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Daftar Jasa ({services.length})</CardTitle>
              <Button
                size="sm"
                className="text-xs"
                onClick={() => {
                  setIsEditing(false);
                  setForm({ id: 0, nama: "", deskripsi: "", hargaDasar: 500000 });
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>+ Jasa</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {feedback && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    feedback.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                      : "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama jasa modifikasi..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                />
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Nama Jasa</th>
                      <th className="py-2.5 px-3">Deskripsi Singkat</th>
                      <th className="py-2.5 px-3 text-right">Harga Dasar</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {filteredServices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Tidak ada jasa modifikasi ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredServices.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {s.nama}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 max-w-xs truncate">
                            {s.deskripsi || "-"}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-orange-600 dark:text-orange-400">
                            {formatCurrency(Number(s.harga_dasar))}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditing(true);
                                setForm({
                                  id: s.id,
                                  nama: s.nama,
                                  deskripsi: s.deskripsi || "",
                                  hargaDasar: Number(s.harga_dasar),
                                });
                              }}
                              className="text-xs text-slate-600 dark:text-zinc-400 hover:text-orange-500 px-2.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700"
                            >
                              Ubah
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Form Tambah/Ubah Jasa (5 cols) Sesuai Wireframe Page 8 */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">
                {isEditing ? "Ubah Jasa Modifikasi" : "Tambah Jasa Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSave} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Nama Jasa</label>
                  <input
                    type="text"
                    required
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Contoh: Pengecatan Airbrush Tangki"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Deskripsi Singkat</label>
                  <textarea
                    rows={4}
                    value={form.deskripsi}
                    onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                    placeholder="Deskripsi langkah pengerjaan atau spesifikasi bahan..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Harga Dasar (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50000"
                    value={form.hargaDasar}
                    onChange={(e) => setForm({ ...form, hargaDasar: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
                    {isSubmitting ? "Menyimpan..." : isEditing ? "Perbarui Jasa" : "Simpan Jasa"}
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
                        setForm({ id: 0, nama: "", deskripsi: "", hargaDasar: 500000 });
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


