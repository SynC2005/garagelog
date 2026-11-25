"use client";

import * as React from "react";
import { Plus, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Floating Window (Dialog) Pelanggan State
  const [showCustomerDialog, setShowCustomerDialog] = React.useState(false);
  const [customerModalError, setCustomerModalError] = React.useState<
    string | null
  >(null);
  const [isEditingCustomer, setIsEditingCustomer] = React.useState(false);
  const [customerForm, setCustomerForm] = React.useState({
    id: 0,
    nama: "",
    telepon: "",
  });

  // Kendaraan Form State
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

  const handleOpenCreateCustomer = () => {
    setIsEditingCustomer(false);
    setCustomerModalError(null);
    setCustomerForm({ id: 0, nama: "", telepon: "" });
    setShowCustomerDialog(true);
  };

  const handleOpenEditCustomer = (c: CustomerList[number]) => {
    setIsEditingCustomer(true);
    setCustomerModalError(null);
    setCustomerForm({ id: c.id, nama: c.nama, telepon: c.telepon });
    setShowCustomerDialog(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerModalError(null);

    if (!customerForm.nama.trim() || !customerForm.telepon.trim()) {
      setCustomerModalError("Nama lengkap dan nomor telepon wajib diisi.");
      return;
    }

    try {
      setIsSubmittingCustomer(true);
      setFeedback(null);

      if (isEditingCustomer) {
        const res = await updateCustomerAction(customerForm.id, {
          nama: customerForm.nama.trim(),
          telepon: customerForm.telepon.trim(),
        });
        if (!res.success || !res.data) {
          setCustomerModalError(res.error || "Gagal mengubah pelanggan.");
          return;
        }
        setCustomers((prev) =>
          prev
            .map((item) =>
              item.id === customerForm.id
                ? { ...item, nama: res.data.nama, telepon: res.data.telepon }
                : item
            )
            .sort((a, b) => a.nama.localeCompare(b.nama))
        );
        const msg = `Data pelanggan "${res.data.nama}" berhasil diperbarui!`;
        toast.success(msg);
        setFeedback({ type: "success", text: msg });
      } else {
        const res = await createCustomerAction({
          nama: customerForm.nama.trim(),
          telepon: customerForm.telepon.trim(),
        });
        if (!res.success || !res.data) {
          setCustomerModalError(res.error || "Gagal menambah pelanggan.");
          return;
        }
        const newCustomer: CustomerList[number] = {
          ...res.data,
          kendaraan: [],
          _count: { pesanan: 0 },
        };
        setCustomers((prev) =>
          [...prev, newCustomer].sort((a, b) => a.nama.localeCompare(b.nama))
        );
        setSelectedCustomerId(res.data.id);
        const msg = `Pelanggan "${res.data.nama}" berhasil ditambahkan!`;
        toast.success(msg);
        setFeedback({ type: "success", text: msg });
      }

      setShowCustomerDialog(false);
      setCustomerForm({ id: 0, nama: "", telepon: "" });
      setIsEditingCustomer(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setCustomerModalError(msg);
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      toast.error("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (
      !vehicleForm.merek.trim() ||
      !vehicleForm.model.trim() ||
      !vehicleForm.nopol.trim()
    )
      return;

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
        if (!res.success || !res.data) {
          setFeedback({
            type: "error",
            text: res.error || "Gagal mengubah kendaraan.",
          });
          return;
        }
        setCustomers((prev) =>
          prev.map((cust) =>
            cust.id === selectedCustomer.id
              ? {
                  ...cust,
                  kendaraan: cust.kendaraan.map((v) =>
                    v.id === vehicleForm.id ? res.data : v
                  ),
                }
              : cust
          )
        );
        toast.success("Data kendaraan berhasil diperbarui!");
        setFeedback({
          type: "success",
          text: "Data kendaraan berhasil diperbarui!",
        });
      } else {
        const res = await createVehicleAction({
          pelangganId: selectedCustomer.id,
          merek: vehicleForm.merek.trim(),
          model: vehicleForm.model.trim(),
          tahun: Number(vehicleForm.tahun),
          nomorPolisi: vehicleForm.nopol.trim().toUpperCase(),
        });
        if (!res.success || !res.data) {
          setFeedback({
            type: "error",
            text: res.error || "Gagal menambah kendaraan.",
          });
          return;
        }
        setCustomers((prev) =>
          prev.map((cust) =>
            cust.id === selectedCustomer.id
              ? { ...cust, kendaraan: [...cust.kendaraan, res.data] }
              : cust
          )
        );
        toast.success("Kendaraan baru berhasil didaftarkan!");
        setFeedback({
          type: "success",
          text: "Kendaraan baru berhasil didaftarkan!",
        });
      }

      setVehicleForm({
        id: 0,
        merek: "",
        model: "",
        tahun: new Date().getFullYear(),
        nopol: "",
      });
      setIsEditingVehicle(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  return (
    <StaffLayout>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Pelanggan dan Kendaraan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Data master pelanggan beserta unit motor miliknya untuk registrasi
          pesanan bengkel.
        </p>
      </div>

      {/* Grid 2 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Daftar Pelanggan */}
        <div className="lg:col-span-6">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Daftar Pelanggan
              </CardTitle>
              <Button size="xs" onClick={handleOpenCreateCustomer}>
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Pelanggan</span>
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
                  aria-label="Cari pelanggan"
                  placeholder="Cari nama atau telepon..."
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/60">
                    <TableRow>
                      <TableHead className="px-3">Nama</TableHead>
                      <TableHead className="px-3">Telepon</TableHead>
                      <TableHead className="px-3 text-center">
                        Unit Motor
                      </TableHead>
                      <TableHead className="px-3 text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Tidak ada data pelanggan ditemukan.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((c) => {
                        const isSelected = c.id === selectedCustomer?.id;
                        return (
                          <TableRow
                            key={c.id}
                            onClick={() => setSelectedCustomerId(c.id)}
                            data-state={isSelected ? "selected" : undefined}
                            className="cursor-pointer"
                          >
                            <TableCell className="px-3 py-2.5 font-medium text-foreground">
                              {c.nama}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-muted-foreground font-mono">
                              {c.telepon}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-center font-bold tabular-nums text-primary">
                              {c.kendaraan?.length || 0}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditCustomer(c);
                                }}
                              >
                                Ubah
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Kendaraan Milik Pelanggan */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between gap-2 space-y-0 border-b border-border">
              <div>
                <CardTitle className="text-base font-semibold">
                  Kendaraan milik: {selectedCustomer?.nama || "-"}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daftar motor yang terdaftar atas nama pelanggan ini
                </p>
              </div>

              <Button
                size="xs"
                onClick={() => {
                  setIsEditingVehicle(false);
                  setVehicleForm({
                    id: 0,
                    merek: "",
                    model: "",
                    tahun: new Date().getFullYear(),
                    nopol: "",
                  });
                }}
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Kendaraan</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {customerVehicles.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  Pelanggan ini belum memiliki motor terdaftar. Tambahkan
                  kendaraan di formulir bawah.
                </p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/60">
                      <TableRow>
                        <TableHead className="px-3">Merek</TableHead>
                        <TableHead className="px-3">Model</TableHead>
                        <TableHead className="px-3 text-center">Tahun</TableHead>
                        <TableHead className="px-3 font-mono">
                          No. Polisi
                        </TableHead>
                        <TableHead className="px-3 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerVehicles.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="px-3 py-2.5 font-semibold text-foreground">
                            {v.merek}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-muted-foreground">
                            {v.model}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">
                            {v.tahun}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 font-mono font-bold text-primary">
                            {v.nomor_polisi}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
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
                            >
                              Ubah
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <CardHeader className="p-4 border-b border-border">
              <CardTitle className="text-sm font-semibold">
                {isEditingVehicle
                  ? "Ubah Data Kendaraan"
                  : "Tambah Kendaraan untuk Pelanggan Ini"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSaveVehicle} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="veh-brand" className="text-xs font-semibold">
                      Merek
                    </Label>
                    <Input
                      id="veh-brand"
                      type="text"
                      required
                      value={vehicleForm.merek}
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, merek: e.target.value })
                      }
                      placeholder="Contoh: Yamaha"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="veh-model" className="text-xs font-semibold">
                      Model
                    </Label>
                    <Input
                      id="veh-model"
                      type="text"
                      required
                      value={vehicleForm.model}
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, model: e.target.value })
                      }
                      placeholder="Contoh: Scorpio 225"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="veh-year" className="text-xs font-semibold">
                      Tahun Pembuatan
                    </Label>
                    <Input
                      id="veh-year"
                      type="number"
                      required
                      value={vehicleForm.tahun}
                      onChange={(e) =>
                        setVehicleForm({
                          ...vehicleForm,
                          tahun: Number(e.target.value),
                        })
                      }
                      placeholder="2018"
                      className="h-9 text-xs tabular-nums"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="veh-nopol" className="text-xs font-semibold">
                      Nomor Polisi
                    </Label>
                    <Input
                      id="veh-nopol"
                      type="text"
                      required
                      value={vehicleForm.nopol}
                      onChange={(e) =>
                        setVehicleForm({ ...vehicleForm, nopol: e.target.value })
                      }
                      placeholder="B 1234 ABC"
                      className="h-9 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingVehicle}
                    className="text-xs"
                  >
                    {isSubmittingVehicle
                      ? "Menyimpan..."
                      : isEditingVehicle
                      ? "Perbarui Kendaraan"
                      : "Simpan Kendaraan"}
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
                        setVehicleForm({
                          id: 0,
                          merek: "",
                          model: "",
                          tahun: new Date().getFullYear(),
                          nopol: "",
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

      {/* Floating Window: Tambah / Ubah Pelanggan */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingCustomer ? "Ubah Pelanggan" : "Tambah Pelanggan Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEditingCustomer
                ? "Perbarui nama lengkap dan nomor telepon pelanggan."
                : "Daftarkan data pelanggan baru untuk ditambahkan ke daftar bengkel."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
            {customerModalError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs">
                  {customerModalError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="cust-name" className="text-xs font-semibold">
                Nama Lengkap
              </Label>
              <Input
                id="cust-name"
                type="text"
                required
                value={customerForm.nama}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, nama: e.target.value })
                }
                placeholder="Contoh: Budi Santoso"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cust-phone" className="text-xs font-semibold">
                Nomor Telepon
              </Label>
              <Input
                id="cust-phone"
                type="text"
                required
                value={customerForm.telepon}
                onChange={(e) =>
                  setCustomerForm({ ...customerForm, telepon: e.target.value })
                }
                placeholder="08xxxxxxxxxx"
                className="h-9 text-xs font-mono"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmittingCustomer}
                onClick={() => setShowCustomerDialog(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingCustomer}
              >
                {isSubmittingCustomer
                  ? "Menyimpan..."
                  : isEditingCustomer
                  ? "Perbarui Pelanggan"
                  : "Simpan Pelanggan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
