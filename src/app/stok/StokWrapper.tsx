"use client";

import * as React from "react";
import { Boxes, Plus, Search, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateTime } from "@/utils/formatDate";
import { adjustStockAction, createPartAction, updatePartAction } from "@/server/api/stok/stokApi";
import { JenisPergerakanStok } from "@prisma/client";

interface SukuCadangItem {
  id: number;
  nama: string;
  SKU: string;
  harga_jual: number;
  stok: number;
  stok_minimum: number;
}

interface PergerakanStokItem {
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
  initialMovements: any[];
}

export function StokWrapper({ initialItems, initialMovements }: StokWrapperProps) {
  const [items, setItems] = React.useState<SukuCadangItem[]>(initialItems);
  const [movements, setMovements] = React.useState<PergerakanStokItem[]>(initialMovements);

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
  const [movementType, setMovementType] = React.useState<"masuk" | "koreksi">("masuk");
  const [amount, setAmount] = React.useState("1");
  const [reason, setReason] = React.useState("");
  const [isSubmittingMovement, setIsSubmittingMovement] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

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

  // Stats calculation
  const totalJenis = items.length;
  const totalMenipis = items.filter((i) => i.stok > 0 && i.stok <= i.stok_minimum).length;
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
      setFeedback({ type: "error", message: "Alasan wajib diisi untuk setiap pergerakan atau koreksi stok!" });
      return;
    }

    if (!selectedItemId) {
      setFeedback({ type: "error", message: "Pilih suku cadang terlebih dahulu." });
      return;
    }

    const qty = Number(amount);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: "error", message: "Jumlah harus lebih besar dari 0." });
      return;
    }

    setIsSubmittingMovement(true);
    setFeedback(null);

    const res = await adjustStockAction({
      sukuCadangId: selectedItemId,
      jenis: movementType === "masuk" ? JenisPergerakanStok.masuk : JenisPergerakanStok.koreksi,
      jumlah: qty,
      alasan: reason.trim(),
    });

    setIsSubmittingMovement(false);

    if (res.success && res.data) {
      const updatedItem = res.data;
      setItems((prev) =>
        prev.map((i) => (i.id === updatedItem.id ? { ...i, stok: updatedItem.stok } : i))
      );
      const target = items.find((i) => i.id === selectedItemId);
      setMovements((prev) => [
        {
          id: Date.now(),
          waktu: new Date(),
          sukuCadangId: selectedItemId,
          jenis: movementType === "masuk" ? JenisPergerakanStok.masuk : JenisPergerakanStok.koreksi,
          jumlah: qty,
          alasan: reason.trim(),
          sukuCadang: {
            nama: target?.nama || "",
            SKU: target?.SKU || "",
          },
        },
        ...prev,
      ]);

      setFeedback({
        type: "success",
        message: `Stok barang "${target?.nama}" berhasil disesuaikan menjadi ${updatedItem.stok} unit.`,
      });
      setReason("");
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({ type: "error", message: res.error || "Gagal mencatat pergerakan stok." });
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addNama.trim() || !addSKU.trim() || !addHarga) {
      alert("Nama barang, SKU, dan harga jual wajib diisi!");
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
      setFeedback({ type: "success", message: `Suku cadang "${res.data.nama}" berhasil ditambahkan!` });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      alert(res.error || "Gagal menambahkan suku cadang.");
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
      setFeedback({ type: "success", message: `Data "${res.data.nama}" berhasil diperbarui!` });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      alert(res.error || "Gagal memperbarui suku cadang.");
    }
  };

  return (
    <StaffLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Stok Suku Cadang & Aksesori
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Pengelolaan inventori barang, pencatatan barang masuk, dan audit koreksi stok fisik.
          </p>
        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>+ Barang</span>
        </Button>
      </div>

      {/* 3 KPI Stat Cards Sesuai Wireframe Page 9 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Jenis barang</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {String(totalJenis).padStart(2, "0")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Stok menipis</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {String(totalMenipis).padStart(2, "0")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">Stok habis</p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {String(totalHabis).padStart(2, "0")}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Suku Cadang Sesuai Wireframe Page 9 */}
      <Card>
        <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau SKU suku cadang..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              />
            </div>

            <div className="sm:col-span-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
              >
                <option value="semua">Semua barang</option>
                <option value="aman">Stok Aman</option>
                <option value="menipis">Stok Menipis</option>
                <option value="habis">Stok Habis</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2.5 px-4 font-mono">SKU</th>
                  <th className="py-2.5 px-4">Nama Barang</th>
                  <th className="py-2.5 px-4 text-center">Stok</th>
                  <th className="py-2.5 px-4 text-center">Minimum</th>
                  <th className="py-2.5 px-4 text-right">Harga Jual</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-zinc-500">
                      Tidak ada suku cadang yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isHabis = item.stok === 0;
                    const isMenipis = item.stok > 0 && item.stok <= item.stok_minimum;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600 dark:text-zinc-400">
                          {item.SKU}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {item.nama}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                          {item.stok}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-500">{item.stok_minimum}</td>
                        <td className="py-3 px-4 text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(item.harga_jual)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={isHabis ? "danger" : isMenipis ? "pending" : "ready"}
                            className="text-[10px] px-2.5"
                          >
                            {isHabis ? "Habis" : isMenipis ? "Menipis" : "Aman"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => handleOpenEdit(item)}
                          >
                            Ubah
                          </Button>
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

      {/* Grid Bawah: Barang Masuk / Koreksi & Riwayat Pergerakan Sesuai Wireframe Page 9 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Barang Masuk atau Koreksi (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Barang Masuk atau Koreksi</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSaveMovement} className="space-y-3.5 text-xs">
                {feedback && (
                  <div
                    className={`p-3 rounded-lg border flex items-center gap-2 ${
                      feedback.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{feedback.message}</span>
                  </div>
                )}

                <div>
                  <label className="font-semibold block mb-1">Pilih Barang</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nama} ({i.SKU}) — Stok: {i.stok}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-6 pt-1 font-semibold">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mType"
                      checked={movementType === "masuk"}
                      onChange={() => setMovementType("masuk")}
                      className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Barang masuk</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="mType"
                      checked={movementType === "koreksi"}
                      onChange={() => setMovementType("koreksi")}
                      className="text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Koreksi stok</span>
                  </label>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Alasan Pergerakan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Wajib diisi (misal: Restok supplier Jaya Motor / Rusak / Hilang)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingMovement}
                  className="w-full text-xs font-semibold pt-1"
                >
                  {isSubmittingMovement ? "Menyimpan..." : "Simpan Pergerakan Stok"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Riwayat Pergerakan Stok (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
              <CardTitle className="text-base">Riwayat Pergerakan Stok</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3">Barang</th>
                      <th className="py-2.5 px-3 text-center">Jenis</th>
                      <th className="py-2.5 px-3 text-center">Jml</th>
                      <th className="py-2.5 px-3">Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                    {movements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Belum ada pergerakan stok tercatat.
                        </td>
                      </tr>
                    ) : (
                      movements.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {formatDateTime(m.waktu)}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white max-w-[150px] truncate">
                            {m.sukuCadang?.nama || "Suku Cadang"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
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
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            {m.jenis === "masuk" ? `+${m.jumlah}` : `-${m.jumlah}`}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-zinc-400 max-w-[180px] truncate">
                            {m.alasan}
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
      </div>

      {/* Modal Tambah Barang Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tambah Suku Cadang Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nama Suku Cadang / Aksesori</label>
                <input
                  type="text"
                  required
                  value={addNama}
                  onChange={(e) => setAddNama(e.target.value)}
                  placeholder="Contoh: Knalpot Yoshimura R77 Full System"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    value={addSKU}
                    onChange={(e) => setAddSKU(e.target.value.toUpperCase())}
                    placeholder="SKU-KNL-006"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={addHarga}
                    onChange={(e) => setAddHarga(e.target.value)}
                    placeholder="1500000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={addStok}
                    onChange={(e) => setAddStok(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={addMinStok}
                    onChange={(e) => setAddMinStok(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah Barang */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ubah Informasi Suku Cadang
              </h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePart} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Nama Suku Cadang</label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    value={editSKU}
                    onChange={(e) => setEditSKU(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editHarga}
                    onChange={(e) => setEditHarga(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Batas Minimum Peringatan Stok</label>
                <input
                  type="number"
                  min="0"
                  value={editMinStok}
                  onChange={(e) => setEditMinStok(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
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
              </div>
            </form>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}
