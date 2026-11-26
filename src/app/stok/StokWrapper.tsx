"use client";

import * as React from "react";
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDateTime } from "@/utils/formatDate";
import {
  adjustStockAction,
  createPartAction,
  updatePartAction,
} from "@/server/api/stok/stokApi";
import { JenisPergerakanStok, PeranUser } from "@prisma/client";
import type { FeatureCode } from "@/lib/rbac";

interface SukuCadangItem {
  id: number;
  nama: string;
  SKU: string;
  harga_jual: number;
  stok: number;
  stok_minimum: number;
}

interface StockMovementItem {
  id: number;
  waktu: Date;
  sukuCadangId: number;
  jenis: JenisPergerakanStok;
  jumlah: number;
  alasan: string;
  sukuCadang?: {
    nama: string;
    SKU: string;
  };
}

interface StokWrapperProps {
  initialItems: SukuCadangItem[];
  initialMovements: StockMovementItem[];
  activeStaff?: { nama: string; peran: PeranUser };
  allowedFeatures?: Partial<Record<FeatureCode, boolean>>;
  canManage?: boolean;
}

export function StokWrapper({
  initialItems,
  initialMovements,
  activeStaff,
  allowedFeatures,
  canManage = true,
}: StokWrapperProps) {
  const [items, setItems] = React.useState<SukuCadangItem[]>(initialItems);
  const [movements, setMovements] =
    React.useState<StockMovementItem[]>(initialMovements);

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  React.useEffect(() => {
    setMovements(initialMovements);
  }, [initialMovements]);

  const [search, setSearch] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("semua");

  // Form Koreksi / Masuk
  const [selectedItemId, setSelectedItemId] = React.useState<number>(
    initialItems.length > 0 ? initialItems[0].id : 0
  );
  const [movementType, setMovementType] = React.useState<"masuk" | "koreksi">(
    "masuk"
  );
  const [amount, setAmount] = React.useState("1");
  const [reason, setReason] = React.useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  // Modal Tambah Barang Baru
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addNama, setAddNama] = React.useState("");
  const [addSKU, setAddSKU] = React.useState("");
  const [addHarga, setAddHarga] = React.useState("");
  const [addStok, setAddStok] = React.useState("0");
  const [addMinStok, setAddMinStok] = React.useState("1");
  const [isAddingPart, setIsAddingPart] = React.useState(false);

  // Modal Ubah Barang
  const [editItem, setEditItem] = React.useState<SukuCadangItem | null>(null);
  const [editNama, setEditNama] = React.useState("");
  const [editSKU, setEditSKU] = React.useState("");
  const [editHarga, setEditHarga] = React.useState("");
  const [editMinStok, setEditMinStok] = React.useState("");
  const [isUpdatingPart, setIsUpdatingPart] = React.useState(false);

  const totalJenis = items.length;
  const totalMenipis = items.filter(
    (i) => i.stok > 0 && i.stok <= i.stok_minimum
  ).length;
  const totalHabis = items.filter((i) => i.stok === 0).length;

  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.SKU.toLowerCase().includes(search.toLowerCase());

    const isMenipis = item.stok > 0 && item.stok <= item.stok_minimum;
    const isHabis = item.stok === 0;
    const isAman = item.stok > item.stok_minimum;

    if (filterStatus === "menipis") return matchSearch && isMenipis;
    if (filterStatus === "habis") return matchSearch && isHabis;
    if (filterStatus === "aman") return matchSearch && isAman;
    return matchSearch;
  });

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setFeedback({
        type: "error",
        message: "Alasan wajib diisi untuk setiap pergerakan atau koreksi stok!",
      });
      return;
    }

    if (!selectedItemId) {
      setFeedback({
        type: "error",
        message: "Pilih suku cadang terlebih dahulu.",
      });
      return;
    }

    const qty = Number(amount);
    if (isNaN(qty)) {
      setFeedback({
        type: "error",
        message: "Masukkan jumlah angka yang valid.",
      });
      return;
    }

    if (movementType === "masuk" && qty <= 0) {
      setFeedback({
        type: "error",
        message: "Jumlah barang masuk harus lebih besar dari 0.",
      });
      return;
    }

    if (movementType === "koreksi" && qty < 0) {
      setFeedback({
        type: "error",
        message: "Jumlah stok fisik tidak boleh bernilai negatif.",
      });
      return;
    }

    setIsSubmittingMovement(true);
    setFeedback(null);

    const res = await adjustStockAction({
      sukuCadangId: selectedItemId,
      jenis:
        movementType === "masuk"
          ? JenisPergerakanStok.masuk
          : JenisPergerakanStok.koreksi,
      jumlah: qty,
      alasan: reason.trim(),
    });

    setIsSubmittingMovement(false);

    if (res.success && res.data) {
      const updatedItem = res.data;
      const target = items.find((i) => i.id === selectedItemId);
      const delta =
        movementType === "masuk"
          ? qty
          : updatedItem.stok - (target?.stok ?? 0);

      setItems((prev) =>
        prev.map((i) =>
          i.id === updatedItem.id ? { ...i, stok: updatedItem.stok } : i
        )
      );

      setMovements((prev) => [
        {
          id: Date.now(),
          waktu: new Date(),
          sukuCadangId: selectedItemId,
          jenis:
            movementType === "masuk"
              ? JenisPergerakanStok.masuk
              : JenisPergerakanStok.koreksi,
          jumlah: delta,
          alasan: reason.trim(),
          sukuCadang: {
            nama: target?.nama || "",
            SKU: target?.SKU || "",
          },
        },
        ...prev,
      ]);

      const msg =
        movementType === "koreksi"
          ? `Stok barang "${target?.nama}" berhasil dikoreksi menjadi ${updatedItem.stok} unit (selisih: ${delta >= 0 ? `+${delta}` : delta}).`
          : `Berhasil menambah ${qty} unit ke stok "${target?.nama}". Total stok sekarang: ${updatedItem.stok} unit.`;

      setFeedback({ type: "success", message: msg });
      toast.success(msg);
      setReason("");
      if (movementType === "koreksi") {
        setAmount(String(updatedItem.stok));
      } else {
        setAmount("1");
      }
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({
        type: "error",
        message: res.error || "Gagal mencatat pergerakan stok.",
      });
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNama.trim() || !addSKU.trim() || !addHarga) {
      toast.error("Nama barang, SKU, dan harga jual wajib diisi!");
      return;
    }

    setIsAddingPart(true);
    const res = await createPartAction({
      nama: addNama.trim(),
      SKU: addSKU.trim(),
      harga_jual: Number(addHarga),
      stok: Number(addStok) || 0,
      stok_minimum: Number(addMinStok) || 0,
    });
    setIsAddingPart(false);

    if (res.success && res.data) {
      setItems((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setAddNama("");
      setAddSKU("");
      setAddHarga("");
      setAddStok("0");
      setAddMinStok("1");
      toast.success(`Suku cadang "${res.data.nama}" berhasil ditambahkan!`);
      setFeedback({
        type: "success",
        message: `Suku cadang "${res.data.nama}" berhasil ditambahkan!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      toast.error(res.error || "Gagal menambahkan suku cadang.");
    }
  };

  const handleOpenEdit = (item: SukuCadangItem) => {
    setEditItem(item);
    setEditNama(item.nama);
    setEditSKU(item.SKU);
    setEditHarga(String(item.harga_jual));
    setEditMinStok(String(item.stok_minimum));
  };

  const handleUpdatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    setIsUpdatingPart(true);
    const res = await updatePartAction(editItem.id, {
      nama: editNama.trim(),
      SKU: editSKU.trim(),
      harga_jual: Number(editHarga),
      stok_minimum: Number(editMinStok),
    });
    setIsUpdatingPart(false);

    if (res.success && res.data) {
      setItems((prev) =>
        prev.map((i) => (i.id === editItem.id ? { ...i, ...res.data } : i))
      );
      setEditItem(null);
      toast.success(`Data "${res.data.nama}" berhasil diperbarui!`);
      setFeedback({
        type: "success",
        message: `Data "${res.data.nama}" berhasil diperbarui!`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      toast.error(res.error || "Gagal memperbarui suku cadang.");
    }
  };

  return (
    <StaffLayout activeStaff={activeStaff} allowedFeatures={allowedFeatures}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Stok Suku Cadang &amp; Aksesori
            </h1>
            {!canManage && (
              <Badge variant="outline" className="text-[11px]">
                Mode Baca Saja
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Pengelolaan inventori barang, pencatatan barang masuk, dan audit
            koreksi stok fisik.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>Tambah Barang</span>
          </Button>
        )}
      </div>

      {/* 3 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="py-0 gap-0">
          <CardContent className="p-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Jenis barang
              </p>
              <p className="text-3xl font-extrabold tabular-nums text-foreground mt-1">
                {String(totalJenis).padStart(2, "0")}
              </p>
            </div>
            <Boxes className="size-4 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
          </CardContent>
        </Card>

        <Card className="py-0 gap-0">
          <CardContent className="p-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Stok menipis
              </p>
              <p className="text-3xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {String(totalMenipis).padStart(2, "0")}
              </p>
            </div>
            <AlertTriangle className="size-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          </CardContent>
        </Card>

        <Card className="py-0 gap-0">
          <CardContent className="p-5 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Stok habis
              </p>
              <p className="text-3xl font-extrabold tabular-nums text-destructive mt-1">
                {String(totalHabis).padStart(2, "0")}
              </p>
            </div>
            <AlertTriangle className="size-4 mt-0.5 text-destructive shrink-0" aria-hidden="true" />
          </CardContent>
        </Card>
      </div>

      {/* Tabel Suku Cadang */}
      <Card className="py-0 gap-0 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search
                className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Cari suku cadang"
                placeholder="Cari nama atau SKU suku cadang..."
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full h-9 text-xs" aria-label="Filter status stok">
                  <SelectValue placeholder="Semua barang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua barang</SelectItem>
                  <SelectItem value="aman">Stok Aman</SelectItem>
                  <SelectItem value="menipis">Stok Menipis</SelectItem>
                  <SelectItem value="habis">Stok Habis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead className="px-4 font-mono">SKU</TableHead>
                <TableHead className="px-4">Nama Barang</TableHead>
                <TableHead className="px-4 text-center">Stok</TableHead>
                <TableHead className="px-4 text-center">Minimum</TableHead>
                <TableHead className="px-4 text-right">Harga Jual</TableHead>
                <TableHead className="px-4 text-center">Status</TableHead>
                {canManage && (
                  <TableHead className="px-4 text-center">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManage ? 7 : 6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Tidak ada suku cadang yang sesuai filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isHabis = item.stok === 0;
                  const isMenipis =
                    item.stok > 0 && item.stok <= item.stok_minimum;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-3 font-mono font-semibold text-muted-foreground">
                        {item.SKU}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium text-foreground">
                        {item.nama}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center font-bold tabular-nums text-foreground">
                        {item.stok}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                        {item.stok_minimum}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(item.harga_jual)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-center">
                        <Badge
                          variant={
                            isHabis ? "danger" : isMenipis ? "pending" : "ready"
                          }
                          className="text-[10px]"
                        >
                          {isHabis ? "Habis" : isMenipis ? "Menipis" : "Aman"}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenEdit(item)}
                          >
                            Ubah
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Grid Bawah: Barang Masuk / Koreksi & Riwayat Pergerakan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {canManage && (
        <div className="lg:col-span-5">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Barang Masuk atau Koreksi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
                {feedback && (
                  <Alert
                    variant={
                      feedback.type === "error" ? "destructive" : "default"
                    }
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
                      {feedback.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pilih Barang</Label>
                  <Select
                    value={selectedItemId ? String(selectedItemId) : ""}
                    onValueChange={(val) => {
                      const newId = Number(val);
                      setSelectedItemId(newId);
                      if (movementType === "koreksi") {
                        const target = items.find((i) => i.id === newId);
                        if (target) setAmount(String(target.stok));
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Pilih barang" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((i) => (
                        <SelectItem key={i.id} value={String(i.id)}>
                          {i.nama} ({i.SKU}) &mdash; Stok: {i.stok}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <RadioGroup
                  value={movementType}
                  onValueChange={(val) => {
                    const m = val as "masuk" | "koreksi";
                    setMovementType(m);
                    if (m === "masuk") {
                      setAmount("1");
                    } else {
                      setAmount(String(selectedItem?.stok ?? 0));
                    }
                  }}
                  className="flex items-center gap-6 pt-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="masuk" id="stok-masuk" />
                    <Label
                      htmlFor="stok-masuk"
                      className="text-xs font-semibold cursor-pointer"
                    >
                      Barang masuk
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="koreksi" id="stok-koreksi" />
                    <Label
                      htmlFor="stok-koreksi"
                      className="text-xs font-semibold cursor-pointer"
                    >
                      Koreksi stok
                    </Label>
                  </div>
                </RadioGroup>

                <div className="space-y-1.5">
                  <Label htmlFor="stok-amount" className="text-xs font-semibold">
                    {movementType === "masuk"
                      ? "Jumlah Barang Masuk (Unit)"
                      : "Stok Fisik Sebenarnya (Hasil Opname)"}
                  </Label>
                  <Input
                    id="stok-amount"
                    type="number"
                    min={movementType === "masuk" ? "1" : "0"}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={
                      movementType === "masuk"
                        ? "Contoh: 5"
                        : selectedItem
                        ? `Stok saat ini ${selectedItem.stok}. Masukkan stok fisik riil`
                        : "Contoh: 3"
                    }
                    className="h-9 text-xs font-mono tabular-nums"
                  />
                  {movementType === "koreksi" && selectedItem && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      Stok saat ini di sistem:{" "}
                      <strong>{selectedItem.stok} unit</strong>. Nilai yang Anda
                      masukkan akan langsung menjadi jumlah stok akhir.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stok-reason" className="text-xs font-semibold">
                    Alasan Pergerakan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="stok-reason"
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Wajib diisi (misal: Restok supplier Jaya Motor / Rusak / Hilang)"
                    className="h-9 text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingMovement}
                  className="w-full text-xs font-semibold"
                >
                  {isSubmittingMovement
                    ? "Menyimpan..."
                    : "Simpan Pergerakan Stok"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Tabel Riwayat Pergerakan Stok */}
        <div className={canManage ? "lg:col-span-7" : "lg:col-span-12"}>
          <Card className="py-0 gap-0 overflow-hidden">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Riwayat Pergerakan Stok
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[380px] overflow-y-auto">
                <Table className="text-xs">
                  <TableHeader className="bg-muted/60 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="px-3">Waktu</TableHead>
                      <TableHead className="px-3">Barang</TableHead>
                      <TableHead className="px-3 text-center">Jenis</TableHead>
                      <TableHead className="px-3 text-center">Jml</TableHead>
                      <TableHead className="px-3">Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-6 text-center text-muted-foreground"
                        >
                          Belum ada pergerakan stok tercatat.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {formatDateTime(m.waktu)}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 font-medium text-foreground max-w-[150px] truncate">
                            {m.sukuCadang?.nama || "Suku Cadang"}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-center">
                            <Badge
                              variant={
                                m.jenis === "masuk"
                                  ? "ready"
                                  : m.jenis === "keluar"
                                  ? "progress"
                                  : "pending"
                              }
                              className="text-[10px]"
                            >
                              {m.jenis}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-center font-mono font-bold tabular-nums">
                            {m.jenis === "masuk"
                              ? `+${Math.abs(m.jumlah)}`
                              : m.jenis === "keluar"
                              ? `-${Math.abs(m.jumlah)}`
                              : m.jumlah > 0
                              ? `+${m.jumlah}`
                              : `${m.jumlah}`}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-muted-foreground max-w-[180px] truncate">
                            {m.alasan}
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
      </div>

      {/* Modal Tambah Barang Baru (shadcn Dialog) */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Suku Cadang Baru</DialogTitle>
            <DialogDescription className="text-xs">
              Daftarkan master suku cadang baru beserta stok awal dan batas
              minimum peringatan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="add-part-name" className="text-xs font-semibold">
                Nama Suku Cadang / Aksesori
              </Label>
              <Input
                id="add-part-name"
                type="text"
                required
                value={addNama}
                onChange={(e) => setAddNama(e.target.value)}
                placeholder="Contoh: Knalpot Yoshimura R77 Full System"
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-part-sku" className="text-xs font-semibold">
                  Kode SKU
                </Label>
                <Input
                  id="add-part-sku"
                  type="text"
                  required
                  value={addSKU}
                  onChange={(e) => setAddSKU(e.target.value.toUpperCase())}
                  placeholder="SKU-KNL-006"
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="add-part-price"
                  className="text-xs font-semibold"
                >
                  Harga Jual (Rp)
                </Label>
                <Input
                  id="add-part-price"
                  type="number"
                  required
                  min="0"
                  value={addHarga}
                  onChange={(e) => setAddHarga(e.target.value)}
                  placeholder="1500000"
                  className="h-9 text-xs font-mono tabular-nums"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="add-part-stock"
                  className="text-xs font-semibold"
                >
                  Stok Awal
                </Label>
                <Input
                  id="add-part-stock"
                  type="number"
                  min="0"
                  value={addStok}
                  onChange={(e) => setAddStok(e.target.value)}
                  className="h-9 text-xs font-mono tabular-nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="add-part-min" className="text-xs font-semibold">
                  Batas Minimum Stok
                </Label>
                <Input
                  id="add-part-min"
                  type="number"
                  min="0"
                  value={addMinStok}
                  onChange={(e) => setAddMinStok(e.target.value)}
                  className="h-9 text-xs font-mono tabular-nums"
                />
              </div>
            </div>
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isAddingPart}>
                {isAddingPart ? "Menyimpan..." : "Simpan Barang"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Ubah Barang (shadcn Dialog) */}
      <Dialog
        open={Boolean(editItem)}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Informasi Suku Cadang</DialogTitle>
            <DialogDescription className="text-xs">
              Perbarui nama, SKU, harga jual, atau batas peringatan minimum stok.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePart} className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-name" className="text-xs font-semibold">
                Nama Suku Cadang
              </Label>
              <Input
                id="edit-part-name"
                type="text"
                required
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-part-sku"
                  className="text-xs font-semibold"
                >
                  Kode SKU
                </Label>
                <Input
                  id="edit-part-sku"
                  type="text"
                  required
                  value={editSKU}
                  onChange={(e) => setEditSKU(e.target.value.toUpperCase())}
                  className="h-9 text-xs font-mono uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-part-price"
                  className="text-xs font-semibold"
                >
                  Harga Jual (Rp)
                </Label>
                <Input
                  id="edit-part-price"
                  type="number"
                  required
                  min="0"
                  value={editHarga}
                  onChange={(e) => setEditHarga(e.target.value)}
                  className="h-9 text-xs font-mono tabular-nums"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-part-min" className="text-xs font-semibold">
                Batas Minimum Peringatan Stok
              </Label>
              <Input
                id="edit-part-min"
                type="number"
                min="0"
                value={editMinStok}
                onChange={(e) => setEditMinStok(e.target.value)}
                className="h-9 text-xs font-mono tabular-nums"
              />
            </div>
            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditItem(null)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isUpdatingPart}>
                {isUpdatingPart ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </StaffLayout>
  );
}
