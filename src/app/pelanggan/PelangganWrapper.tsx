"use client";

import * as React from "react";
import { Users, Bike, Plus, Search, Edit2, AlertCircle, CheckCircle2 } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  createCustomerAction,
  updateCustomerAction,
  createVehicleAction,
  updateVehicleAction,
} from "@/server/api/pelanggan/pelangganApi";
import type { getCustomers } from "@/server/services/pelanggan/pelangganService";

type CustomerList = Awaited<ReturnType<typeof getCustomers>>;

interface PelangganWrapperProps {
  initialCustomers: CustomerList;
}

export function PelangganWrapper({ initialCustomers }: PelangganWrapperProps) {
  const [customers, setCustomers] = React.useState(initialCustomers);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number>(
    initialCustomers[0]?.id || 0
  );
  const [search, setSearch] = React.useState("");
  const [isSubmittingCustomer, setIsSubmittingCustomer] = React.useState(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Customer Form state
  const [isEditingCustomer, setIsEditingCustomer] = React.useState(false);
  const [customerForm, setCustomerForm] = React.useState({ id: 0, nama: "", telepon: "" });

  // Vehicle Form state
  const [isEditingVehicle, setIsEditingVehicle] = React.useState(false);
  const [vehicleForm, setVehicleForm] = React.useState({
    id: 0,
    merek: "",
    model: "",
    tahun: new Date().getFullYear(),
    nopol: "",
  });

  const selectedCustomer =
    customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const customerVehicles = selectedCustomer?.kendaraan || [];

  const filteredCustomers = customers.filter(
    (c) =>
      c.nama.toLowerCase().includes(search.toLowerCase()) ||
      c.telepon.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.nama.trim() || !customerForm.telepon.trim()) return;

    try {
      setIsSubmittingCustomer(true);
      setFeedback(null);

      if (isEditingCustomer) {
        const res = await updateCustomerAction(customerForm.id, {
          nama: customerForm.nama.trim(),
          telepon: customerForm.telepon.trim(),
        });
        if (!res.success) {
          setFeedback({ type: "error", text: res.error || "Gagal mengubah pelanggan." });
          return;
        }
        setFeedback({ type: "success", text: "Data pelanggan berhasil diperbarui!" });
      } else {
        const res = await createCustomerAction({
          nama: customerForm.nama.trim(),
          telepon: customerForm.telepon.trim(),
        });
        if (!res.success) {
          setFeedback({ type: "error", text: res.error || "Gagal menambah pelanggan." });
          return;
        }
        setFeedback({ type: "success", text: "Pelanggan baru berhasil ditambahkan!" });
      }

      setCustomerForm({ id: 0, nama: "", telepon: "" });
      setIsEditingCustomer(false);
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!vehicleForm.merek.trim() || !vehicleForm.model.trim() || !vehicleForm.nopol.trim()) return;

    try {
      setIsSubmittingVehicle(true);
      setFeedback(null);

      if (isEditingVehicle) {
        const res = await updateVehicleAction(vehicleForm.id, {
          merek: vehicleForm.merek.trim(),
          model: vehicleForm.model.trim(),
          tahun: Number(vehicleForm.tahun),
          nomorPolisi: vehicleForm.nopol.trim().toUpperCase(),
        });
        if (!res.success) {
          setFeedback({ type: "error", text: res.error || "Gagal mengubah kendaraan." });
          return;
        }
        setFeedback({ type: "success", text: "Data kendaraan berhasil diperbarui!" });
      } else {
        const res = await createVehicleAction({
          pelangganId: selectedCustomer.id,
          merek: vehicleForm.merek.trim(),
          model: vehicleForm.model.trim(),
          tahun: Number(vehicleForm.tahun),
          nomorPolisi: vehicleForm.nopol.trim().toUpperCase(),
        });
        if (!res.success) {
          setFeedback({ type: "error", text: res.error || "Gagal menambah kendaraan." });
          return;
        }
        setFeedback({ type: "success", text: "Kendaraan baru berhasil didaftarkan!" });
      }

      setVehicleForm({ id: 0, merek: "", model: "", tahun: new Date().getFullYear(), nopol: "" });
      setIsEditingVehicle(false);
      window.location.reload();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  return (
    <StaffLayout>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pelanggan dan Kendaraan
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Data master pelanggan beserta unit motor miliknya untuk registrasi pesanan bengkel.
        </p>
      </div>

      {/* Grid 2 Kolom Sesuai Wireframe Page 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pelanggan (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Daftar Pelanggan</CardTitle>
              <Button
                size="sm"
                className="text-xs"
                onClick={() => {
                  setIsEditingCustomer(false);
                  setCustomerForm({ id: 0, nama: "", telepon: "" });
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>+ Pelanggan</span>
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

              {/* Search input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau telepon..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                />
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Nama</th>
                      <th className="py-2.5 px-3">Telepon</th>
                      <th className="py-2.5 px-3 text-center">Unit Motor</th>
                      <th className="py-2.5 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
                          Tidak ada data pelanggan ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isSelected = c.id === selectedCustomer?.id;
                        return (
                          <tr
                            key={c.id}
                            onClick={() => setSelectedCustomerId(c.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-orange-50/60 dark:bg-orange-950/20 font-semibold"
                                : "hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-900 dark:text-white">{c.nama}</td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-300">
                              {c.telepon}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-orange-600 dark:text-orange-400">
                              {c.kendaraan?.length || 0}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingCustomer(true);
                                  setCustomerForm({ id: c.id, nama: c.nama, telepon: c.telepon });
                                }}
                                className="text-xs text-slate-600 dark:text-zinc-400 hover:text-orange-500 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700"
                              >
                                Ubah
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Form Ubah / Tambah Pelanggan Sesuai Wireframe Page 7 */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-sm">
                {isEditingCustomer ? "Ubah Pelanggan" : "Tambah Pelanggan Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={customerForm.nama}
                    onChange={(e) => setCustomerForm({ ...customerForm, nama: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    required
                    value={customerForm.telepon}
                    onChange={(e) => setCustomerForm({ ...customerForm, telepon: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={isSubmittingCustomer} className="text-xs">
                    {isSubmittingCustomer ? "Menyimpan..." : isEditingCustomer ? "Perbarui Pelanggan" : "Simpan Pelanggan"}
                  </Button>
                  {isEditingCustomer && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSubmittingCustomer}
                      className="text-xs"
                      onClick={() => {
                        setIsEditingCustomer(false);
                        setCustomerForm({ id: 0, nama: "", telepon: "" });
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

        {/* Kolom Kanan: Kendaraan Milik Pelanggan (6 cols) Sesuai Wireframe Page 7 */}
        <div className="lg:col-span-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <CardTitle className="text-base">
                  Kendaraan milik: {selectedCustomer?.nama || "-"}
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Daftar motor yang terdaftar atas nama pelanggan ini
                </p>
              </div>

              <Button
                size="sm"
                className="text-xs"
                onClick={() => {
                  setIsEditingVehicle(false);
                  setVehicleForm({ id: 0, merek: "", model: "", tahun: new Date().getFullYear(), nopol: "" });
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>+ Kendaraan</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {customerVehicles.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Pelanggan ini belum memiliki motor terdaftar. Tambahkan kendaraan di formulir bawah.
                </p>
              ) : (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-2.5 px-3">Merek</th>
                        <th className="py-2.5 px-3">Model</th>
                        <th className="py-2.5 px-3 text-center">Tahun</th>
                        <th className="py-2.5 px-3 font-mono">No. Polisi</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {customerVehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {v.merek}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300">{v.model}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{v.tahun}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                            {v.nomor_polisi}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingVehicle(true);
                                setVehicleForm({
                                  id: v.id,
                                  merek: v.merek,
                                  model: v.model,
                                  tahun: v.tahun,
                                  nopol: v.nomor_polisi,
                                });
                              }}
                              className="text-xs text-slate-600 dark:text-zinc-400 hover:text-orange-500 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700"
                            >
                              Ubah
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

          {/* Form Tambah / Ubah Kendaraan Sesuai Wireframe Page 7 */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-sm">
                {isEditingVehicle ? "Ubah Data Kendaraan" : "Tambah Kendaraan untuk Pelanggan Ini"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Merek</label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.merek}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, merek: e.target.value })}
                      placeholder="Contoh: Yamaha"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Model</label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      placeholder="Contoh: Scorpio 225"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Tahun Pembuatan</label>
                    <input
                      type="number"
                      required
                      value={vehicleForm.tahun}
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, tahun: Number(e.target.value) })
                      }
                      placeholder="2018"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nomor Polisi</label>
                    <input
                      type="text"
                      required
                      value={vehicleForm.nopol}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, nopol: e.target.value })}
                      placeholder="B 1234 ABC"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" size="sm" disabled={isSubmittingVehicle} className="text-xs">
                    {isSubmittingVehicle ? "Menyimpan..." : isEditingVehicle ? "Perbarui Kendaraan" : "Simpan Kendaraan"}
                  </Button>
                  {isEditingVehicle && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSubmittingVehicle}
                      className="text-xs"
                      onClick={() => {
                        setIsEditingVehicle(false);
                        setVehicleForm({ id: 0, merek: "", model: "", tahun: new Date().getFullYear(), nopol: "" });
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

