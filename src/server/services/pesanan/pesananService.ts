import { prisma } from "@/server/db";
import { StatusPesanan, MetodePembayaran, JenisPergerakanStok } from "@prisma/client";

/**
 * Generate kode pesanan acak dan sulit ditebak (FR-08)
 * Format: PSN-XXXX-XXXX
 */
export function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `PSN-${part1}-${part2}`;
}

/**
 * Buat pesanan baru lengkap dengan jenis jasa, suku cadang, dan tahapan pengerjaan (FR-07, FR-09, FR-16)
 */
export async function createOrder(data: {
  pelangganId: number;
  kendaraanId: number;
  dibuatOlehId: number;
  perkiraanSelesai?: Date;
  catatan?: string;
  jasaIds: number[];
  sukuCadang: { sukuCadangId: number; jumlah: number; harga: number }[];
  tahapIds: number[];
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Ambil detail jasa untuk menghitung estimasi
    const services = await tx.jasa.findMany({
      where: { id: { in: data.jasaIds } },
    });

    const subtotalJasa = services.reduce((sum, j) => sum + Number(j.harga_dasar), 0);
    const subtotalPart = data.sukuCadang.reduce((sum, p) => sum + p.harga * p.jumlah, 0);
    const totalEstimasi = subtotalJasa + subtotalPart;

    // 2. Buat record Pesanan utama
    const kodePesanan = generateOrderCode();
    const order = await tx.pesanan.create({
      data: {
        kode_pesanan: kodePesanan,
        pelangganId: data.pelangganId,
        kendaraanId: data.kendaraanId,
        dibuat_oleh: data.dibuatOlehId,
        estimasi_total: totalEstimasi,
        perkiraan_selesai: data.perkiraanSelesai,
        status: StatusPesanan.Menunggu_Persetujuan,
      },
    });

    // 3. Tambahkan item jasa
    if (services.length > 0) {
      await tx.itemJasa.createMany({
        data: services.map((s) => ({
          pesananId: order.id,
          jasaId: s.id,
          harga: s.harga_dasar,
          catatan: data.catatan,
        })),
      });
    }

    // 4. Tambahkan item suku cadang
    if (data.sukuCadang.length > 0) {
      await tx.itemSukuCadang.createMany({
        data: data.sukuCadang.map((p) => ({
          pesananId: order.id,
          sukuCadangId: p.sukuCadangId,
          jumlah: p.jumlah,
          harga: p.harga,
        })),
      });
    }

    // 5. Salin template tahapan terpilih ke TahapPesanan (FR-16)
    const templates = await tx.templateTahap.findMany({
      where: { id: { in: data.tahapIds } },
      orderBy: { urutan: "asc" },
    });

    if (templates.length > 0) {
      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        await tx.tahapPesanan.create({
          data: {
            pesananId: order.id,
            nama: t.nama,
            urutan: i + 1,
            wajib_foto: t.wajib_foto,
            status: i === 0 ? "berjalan" : "belum",
          },
        });
      }
    }

    return order;
  });
}

/**
 * Persetujuan estimasi dan mulai pengerjaan:
 * Memotong stok suku cadang secara otomatis dalam transaksi atomik (FR-10, FR-13)
 */
export async function approveAndStartOrder(pesananId: number) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.pesanan.findUnique({
      where: { id: pesananId },
      include: {
        itemSukuCadang: {
          include: { sukuCadang: true },
        },
      },
    });

    if (!order) throw new Error("Pesanan tidak ditemukan.");
    if (order.status === StatusPesanan.Dikerjakan) {
      throw new Error("Pesanan sudah dalam status Dikerjakan.");
    }

    // Validasi ketersediaan stok sebelum dikurangi
    for (const item of order.itemSukuCadang) {
      if (item.sukuCadang.stok < item.jumlah) {
        throw new Error(
          `Stok untuk ${item.sukuCadang.nama} tidak mencukupi (tersedia: ${item.sukuCadang.stok}, dibutuhkan: ${item.jumlah}).`
        );
      }
    }

    // Potong stok dan catat mutasi PergerakanStok (FR-13)
    for (const item of order.itemSukuCadang) {
      await tx.sukuCadang.update({
        where: { id: item.sukuCadangId },
        data: { stok: { decrement: item.jumlah } },
      });

      await tx.pergerakanStok.create({
        data: {
          sukuCadangId: item.sukuCadangId,
          jenis: JenisPergerakanStok.keluar,
          jumlah: item.jumlah,
          alasan: `Pemotongan otomatis untuk pesanan ${order.kode_pesanan}`,
        },
      });
    }

    // Ubah status pesanan menjadi Dikerjakan
    return await tx.pesanan.update({
      where: { id: pesananId },
      data: {
        status: StatusPesanan.Dikerjakan,
        disetujui_pada: new Date(),
      },
    });
  });
}

/**
 * Ambil daftar semua pesanan dengan filter dan pagination
 */
export async function getOrders(params?: {
  search?: string;
  status?: StatusPesanan;
  skip?: number;
  take?: number;
}) {
  const { search, status, skip = 0, take = 20 } = params || {};

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { kode_pesanan: { contains: search, mode: "insensitive" } },
      { pelanggan: { nama: { contains: search, mode: "insensitive" } } },
      { kendaraan: { nomor_polisi: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.pesanan.count({ where }),
    prisma.pesanan.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: "desc" },
      include: {
        pelanggan: true,
        kendaraan: true,
        itemJasa: { include: { jasa: true } },
        tahapan: {
          where: { status: "berjalan" },
          take: 1,
        },
        pembayaran: true,
      },
    }),
  ]);

  return { total, orders };
}

/**
 * Ambil detail pesanan lengkap berdasarkan kode_pesanan unik
 */
export async function getOrderByCode(kodePesanan: string) {
  return await prisma.pesanan.findUnique({
    where: { kode_pesanan: kodePesanan },
    include: {
      pelanggan: true,
      kendaraan: true,
      userPembuat: { select: { id: true, nama: true, peran: true } },
      itemJasa: { include: { jasa: true } },
      itemSukuCadang: { include: { sukuCadang: true } },
      tahapan: {
        orderBy: { urutan: "asc" },
        include: {
          pembaruan: {
            include: { foto: true },
          },
        },
      },
      pembayaran: {
        orderBy: { tanggal: "desc" },
        include: { userPencatat: { select: { nama: true } } },
      },
    },
  });
}

/**
 * Catat pembayaran bertahap (DP / Pelunasan) (FR-27, FR-28)
 */
export async function recordPayment(data: {
  pesananId: number;
  jumlah: number;
  metode: MetodePembayaran;
  dicatatOlehId: number;
}) {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.pembayaran.create({
      data: {
        pesananId: data.pesananId,
        jumlah: data.jumlah,
        metode: data.metode,
        dicatat_oleh: data.dicatatOlehId,
      },
    });

    // Cek total akumulasi pembayaran
    const order = await tx.pesanan.findUnique({
      where: { id: data.pesananId },
      include: { pembayaran: true },
    });

    if (order) {
      const totalPaid = order.pembayaran.reduce((sum, p) => sum + Number(p.jumlah), 0);
      const totalEstimasi = Number(order.estimasi_total);

      // Jika sudah lunas dan motor sudah di tahap siap diambil, boleh transisi ke Selesai
      if (totalPaid >= totalEstimasi && order.status === StatusPesanan.Siap_Diambil) {
        await tx.pesanan.update({
          where: { id: data.pesananId },
          data: { status: StatusPesanan.Selesai },
        });
      }
    }

    return payment;
  });
}

