"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Wrench,
  Package,
  ListOrdered,
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/formatCurrency";
import { createOrderAction } from "@/server/api/pesanan/pesananApi";

interface CustomerWithVehicles {
  id: number;
  nama: string;
  telepon: string;
  kendaraan: {
    id: number;
    merek: string;
    model: string;
    tahun: number;
    nomor_polisi: string;
  }[];
}

interface ServiceItem {
  id: number;
  nama: string;
  harga_dasar: number;
}

interface SparePartItem {
  id: number;
  nama: string;
  SKU: string;
  harga_jual: number;
  stok: number;
}

interface StageTemplateItem {
  id: number;
  urutan: number;
  nama: string;
  wajib_foto: boolean;
}

interface BuatPesananWrapperProps {
  customers: CustomerWithVehicles[];
  servicesCatalog: ServiceItem[];
  sparePartsCatalog: SparePartItem[];
  stageTemplates: StageTemplateItem[];
}

export function BuatPesananWrapper({
  customers,
  servicesCatalog,
  sparePartsCatalog,
  stageTemplates,
}: BuatPesananWrapperProps) {
  const router = useRouter();

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<number>(
    customers.length > 0 ? customers[0].id : 0
  );
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  const [selectedVehicleId, setSelectedVehicleId] = React.useState<number>(
    currentCustomer && currentCustomer.kendaraan.length > 0
      ? currentCustomer.kendaraan[0].id
      : 0
  );

  React.useEffect(() => {
    if (currentCustomer && currentCustomer.kendaraan.length > 0) {
      setSelectedVehicleId(currentCustomer.kendaraan[0].id);
    } else {
      setSelectedVehicleId(0);
    }
  }, [selectedCustomerId, currentCustomer]);

  const [selectedServices, setSelectedServices] = React.useState<number[]>(
    servicesCatalog.slice(0, 2).map((s) => s.id)
  );

  const [orderParts, setOrderParts] = React.useState<
    { sukuCadangId: number; nama: string; jumlah: number; harga: number }[]
  >([]);

  const [selectedPartId, setSelectedPartId] = React.useState<number>(
    sparePartsCatalog.length > 0 ? sparePartsCatalog[0].id : 0
  );
  const [selectedPartQty, setSelectedPartQty] = React.useState<string>("1");

  const [stages, setStages] = React.useState(
    stageTemplates.map((stg) => ({ ...stg, selected: true }))
  );

  const defaultFinishDate = new Date();
  defaultFinishDate.setDate(defaultFinishDate.getDate() + 14);
  const [perkiraanSelesai, setPerkiraanSelesai] = React.useState(
    defaultFinishDate.toISOString().split("T")[0]
  );
  const [catatan, setCatatan] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleAddPart = () => {
    const part = sparePartsCatalog.find((p) => p.id === selectedPartId);
    if (!part) return;

    const qty = Number(selectedPartQty);
    if (isNaN(qty) || qty <= 0) return;

    const exists = orderParts.find((p) => p.sukuCadangId === selectedPartId);
    if (exists) {
      setOrderParts((prev) =>
        prev.map((p) =>
          p.sukuCadangId === selectedPartId
            ? { ...p, jumlah: p.jumlah + qty }
            : p
        )
      );
    } else {
      setOrderParts((prev) => [
        ...prev,
        {
          sukuCadangId: part.id,
          nama: part.nama,
          jumlah: qty,
          harga: part.harga_jual,
        },
      ]);
    }
  };

  const handleRemovePart = (partId: number) => {
    setOrderParts((prev) => prev.filter((p) => p.sukuCadangId !== partId));
  };

  const toggleStage = (id: number) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const subtotalJasa = selectedServices.reduce((sum, sId) => {
    const s = servicesCatalog.find((item) => item.id === sId);
    return sum + (s?.harga_dasar || 0);
  }, 0);

  const subtotalParts = orderParts.reduce(
    (sum, p) => sum + p.harga * p.jumlah,
    0
  );

  const totalEstimasi = subtotalJasa + subtotalParts;

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!selectedVehicleId) {
      setErrorMessage(
        "Pelanggan ini belum memiliki kendaraan terdaftar. Daftarkan kendaraan di menu Pelanggan terlebih dahulu."
      );
      return;
    }
    if (selectedServices.length === 0 && orderParts.length === 0) {
      setErrorMessage(
        "Pilih minimal satu layanan jasa atau satu suku cadang untuk pesanan ini."
      );
      return;
    }

    const activeStageIds = stages.filter((s) => s.selected).map((s) => s.id);
    if (activeStageIds.length === 0) {
      setErrorMessage(
        "Pilih minimal satu tahapan pengerjaan untuk pesanan ini."
      );
      return;
    }

    setIsSubmitting(true);

    const res = await createOrderAction({
      pelangganId: selectedCustomerId,
      kendaraanId: selectedVehicleId,
      dibuatOlehId: 1,
      perkiraanSelesai: perkiraanSelesai,
      catatan: catatan.trim(),
      jasaIds: selectedServices,
      sukuCadang: orderParts.map((p) => ({
        sukuCadangId: p.sukuCadangId,
        jumlah: p.jumlah,
        harga: p.harga,
      })),
      tahapIds: activeStageIds,
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      toast.success(`Pesanan ${res.data.kode_pesanan} berhasil dibuat!`);
      router.push(`/pesanan/${res.data.kode_pesanan}`);
    } else {
      setErrorMessage(res.error || "Gagal membuat pesanan baru.");
    }
  };

  return (
    <StaffLayout>
      {/* Header Form */}
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon">
          <Link href="/pesanan" aria-label="Kembali ke daftar pesanan">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Buat Pesanan Modifikasi
          </h1>
          <p className="text-xs text-muted-foreground">
            Formulir pendaftaran pelanggan, penentuan modifikasi, suku cadang, dan
            template tahapan.
          </p>
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSaveOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Kolom Form Input (8 kolom) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Pelanggan & Kendaraan */}
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center gap-2 space-y-0">
              <User className="size-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base font-semibold">
                1. Pelanggan &amp; Kendaraan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Pilih Pelanggan</Label>
                  <Select
                    value={selectedCustomerId ? String(selectedCustomerId) : ""}
                    onValueChange={(val) => setSelectedCustomerId(Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue placeholder="Pilih pelanggan" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nama} ({c.telepon})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Pilih Kendaraan Motor
                  </Label>
                  {currentCustomer && currentCustomer.kendaraan.length > 0 ? (
                    <Select
                      value={selectedVehicleId ? String(selectedVehicleId) : ""}
                      onValueChange={(val) => setSelectedVehicleId(Number(val))}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue placeholder="Pilih motor" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentCustomer.kendaraan.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.merek} {v.model} ({v.nomor_polisi}) - {v.tahun}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2.5 border border-dashed border-destructive/40 rounded-md text-destructive text-[11px]">
                      Belum ada motor terdaftar untuk pelanggan ini.{" "}
                      <Link href="/pelanggan" className="underline font-bold">
                        Tambah di Pelanggan &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Paket Modifikasi / Layanan Jasa */}
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center gap-2 space-y-0">
              <Wrench className="size-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base font-semibold">
                2. Paket Jasa &amp; Pengerjaan Modifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs">
              <div className="divide-y divide-border">
                {servicesCatalog.map((service) => {
                  const checked = selectedServices.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className="py-2.5 px-2 flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        <span className="font-semibold text-foreground">
                          {service.nama}
                        </span>
                      </div>
                      <span className="font-bold tabular-nums text-foreground">
                        {formatCurrency(service.harga_dasar)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 3. Suku Cadang & Komponen Tambahan */}
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center gap-2 space-y-0">
              <Package className="size-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base font-semibold">
                3. Suku Cadang &amp; Komponen Kustom
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <Select
                    value={selectedPartId ? String(selectedPartId) : ""}
                    onValueChange={(val) => setSelectedPartId(Number(val))}
                  >
                    <SelectTrigger className="w-full h-9 text-xs" aria-label="Pilih suku cadang">
                      <SelectValue placeholder="Pilih suku cadang" />
                    </SelectTrigger>
                    <SelectContent>
                      {sparePartsCatalog.map((part) => (
                        <SelectItem key={part.id} value={String(part.id)}>
                          {part.nama} (Stok: {part.stok}) &mdash;{" "}
                          {formatCurrency(part.harga_jual)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-24">
                  <Input
                    type="number"
                    min="1"
                    value={selectedPartQty}
                    onChange={(e) => setSelectedPartQty(e.target.value)}
                    aria-label="Jumlah suku cadang"
                    className="h-9 text-xs font-mono tabular-nums"
                    placeholder="Jml"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPart}
                  className="w-full sm:w-auto h-9"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Tambah</span>
                </Button>
              </div>

              {orderParts.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table className="text-xs">
                    <TableHeader className="bg-muted/60">
                      <TableRow>
                        <TableHead className="px-3">Komponen</TableHead>
                        <TableHead className="px-3 text-center">Jml</TableHead>
                        <TableHead className="px-3 text-right">Harga</TableHead>
                        <TableHead className="px-3 text-right">Subtotal</TableHead>
                        <TableHead className="px-3 text-center">Hapus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderParts.map((p) => (
                        <TableRow key={p.sukuCadangId}>
                          <TableCell className="px-3 font-medium">
                            {p.nama}
                          </TableCell>
                          <TableCell className="px-3 text-center font-mono tabular-nums">
                            {p.jumlah}
                          </TableCell>
                          <TableCell className="px-3 text-right tabular-nums">
                            {formatCurrency(p.harga)}
                          </TableCell>
                          <TableCell className="px-3 text-right font-bold tabular-nums">
                            {formatCurrency(p.harga * p.jumlah)}
                          </TableCell>
                          <TableCell className="px-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemovePart(p.sukuCadangId)}
                              aria-label={`Hapus ${p.nama}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
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

          {/* 4. Template Tahapan Pengerjaan */}
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center gap-2 space-y-0">
              <ListOrdered className="size-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-base font-semibold">
                4. Template Tahapan Pengerjaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2 text-xs">
              <p className="text-muted-foreground mb-2">
                Pilih tahapan alur modifikasi yang akan dijalankan oleh montir:
              </p>
              <div className="space-y-1.5">
                {stages.map((stg) => (
                  <label
                    key={stg.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        checked={stg.selected}
                        onCheckedChange={() => toggleStage(stg.id)}
                      />
                      <span className="font-medium text-foreground">
                        {stg.urutan}. {stg.nama}
                      </span>
                    </div>
                    {stg.wajib_foto && (
                      <Badge variant="info" className="text-[10px]">
                        Wajib Foto
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kolom Samping: Ringkasan Biaya & Submit */}
        <div className="lg:col-span-4">
          <Card className="py-0 gap-0">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-base font-semibold">
                Ringkasan Estimasi Biaya
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Jasa ({selectedServices.length} item)</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(subtotalJasa)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Suku Cadang ({orderParts.length} item)</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(subtotalParts)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-baseline">
                <span className="font-bold text-sm text-foreground">
                  Total Estimasi:
                </span>
                <span className="text-xl font-black tabular-nums text-primary">
                  {formatCurrency(totalEstimasi)}
                </span>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="order-date" className="text-xs font-semibold">
                  Perkiraan Tanggal Selesai
                </Label>
                <Input
                  id="order-date"
                  type="date"
                  required
                  value={perkiraanSelesai}
                  onChange={(e) => setPerkiraanSelesai(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="order-notes" className="text-xs font-semibold">
                  Catatan / Konsep Kustom
                </Label>
                <Textarea
                  id="order-notes"
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan konsep motor, warna yang diinginkan, dsb..."
                  className="text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 text-xs font-semibold"
              >
                {isSubmitting ? "Menyimpan Pesanan..." : "Buat Pesanan Modifikasi"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </StaffLayout>
  );
}
