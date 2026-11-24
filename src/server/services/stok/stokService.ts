import { prisma } from "@/server/db";
import { JenisPergerakanStok } from "@prisma/client";

/**
 * Ambil seluruh katalog suku cadang beserta ringkasan status stok
 */
export async function getInventory(params?: { search?: string; statusFilter?: string }) {
  const { search, statusFilter } = params || {};

  const where: any = {};
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { SKU: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.sukuCadang.findMany({
    where,
    orderBy: { nama: "asc" },
  });

  let filtered = items;
  if (statusFilter === "menipis") {
    filtered = items.filter((i) => i.stok > 0 && i.stok <= i.stok_minimum);
  } else if (statusFilter === "habis") {
    filtered = items.filter((i) => i.stok === 0);
  } else if (statusFilter === "aman") {
    filtered = items.filter((i) => i.stok > i.stok_minimum);
  }

  return filtered;
}

/**
 * Ambil barang yang berada di bawah batas stok minimum untuk peringatan dashboard (FR-15)
 */
export async function getLowStockAlerts() {
  const items = await prisma.sukuCadang.findMany({
    orderBy: { stok: "asc" },
  });
  return items.filter((i) => i.stok <= i.stok_minimum);
}

/**
 * Tambah suku cadang baru ke master data inventori
 */
export async function createPart(data: {
  nama: string;
  SKU: string;
  harga_jual: number;
  stok?: number;
  stok_minimum?: number;
}) {
  if (!data.nama || !data.SKU || data.harga_jual <= 0) {
    throw new Error("Nama, SKU, dan harga jual suku cadang wajib diisi.");
  }

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.sukuCadang.findUnique({
      where: { SKU: data.SKU },
    });
    if (existing) {
      throw new Error(`SKU "${data.SKU}" sudah digunakan oleh barang lain.`);
    }

    const created = await tx.sukuCadang.create({
      data: {
        nama: data.nama,
        SKU: data.SKU,
        harga_jual: data.harga_jual,
        stok: data.stok || 0,
        stok_minimum: data.stok_minimum || 0,
      },
    });

    if (data.stok && data.stok > 0) {
      await tx.pergerakanStok.create({
        data: {
          sukuCadangId: created.id,
          jenis: JenisPergerakanStok.masuk,
          jumlah: data.stok,
          alasan: "Stok awal pendaftaran barang baru",
        },
      });
    }

    return created;
  });
}

/**
 * Perbarui informasi suku cadang (harga jual, nama, stok minimum)
 */
export async function updatePart(
  id: number,
  data: {
    nama?: string;
    SKU?: string;
    harga_jual?: number;
    stok_minimum?: number;
  }
) {
  return await prisma.sukuCadang.update({
    where: { id },
    data,
  });
}

/**
 * Catat barang masuk atau koreksi stok manual dengan alasan wajib (FR-14)
 * - Jika jenis === "masuk": data.jumlah adalah penambahan unit (harus > 0)
 * - Jika jenis === "koreksi": data.jumlah adalah stok fisik riil hasil opname (harus >= 0)
 */
export async function adjustStock(data: {
  sukuCadangId: number;
  jenis: JenisPergerakanStok; // masuk atau koreksi
  jumlah: number;
  alasan: string;
}) {
  if (!data.alasan || data.alasan.trim().length === 0) {
    throw new Error("Alasan pergerakan atau koreksi stok wajib diisi secara jelas.");
  }

  return await prisma.$transaction(async (tx) => {
    const item = await tx.sukuCadang.findUnique({
      where: { id: data.sukuCadangId },
    });

    if (!item) throw new Error("Suku cadang tidak ditemukan.");

    let newStock: number;
    let deltaMovement: number;

    if (data.jenis === JenisPergerakanStok.masuk) {
      if (data.jumlah <= 0) {
        throw new Error("Jumlah barang masuk harus lebih besar dari 0.");
      }
      newStock = item.stok + data.jumlah;
      deltaMovement = data.jumlah;
    } else {
      // Koreksi stok fisik akhir hasil opname
      if (data.jumlah < 0) {
        throw new Error("Stok fisik hasil koreksi tidak boleh bernilai negatif.");
      }
      newStock = data.jumlah;
      deltaMovement = newStock - item.stok; // selisih perubahan stok (bisa positif atau negatif)
    }

    // 1. Update stok suku cadang ke angka baru
    const updated = await tx.sukuCadang.update({
      where: { id: data.sukuCadangId },
      data: { stok: newStock },
    });

    // 2. Catat audit trail PergerakanStok dengan selisih mutasi
    await tx.pergerakanStok.create({
      data: {
        sukuCadangId: data.sukuCadangId,
        jenis: data.jenis,
        jumlah: deltaMovement,
        alasan: data.alasan,
      },
    });

    return updated;
  });
}

/**
 * Ambil riwayat pergerakan stok suku cadang
 */
export async function getStockMovements(take: number = 30) {
  return await prisma.pergerakanStok.findMany({
    take,
    orderBy: { waktu: "desc" },
    include: {
      sukuCadang: { select: { nama: true, SKU: true } },
    },
  });
}

