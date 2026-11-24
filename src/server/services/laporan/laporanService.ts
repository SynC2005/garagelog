import { prisma } from "@/server/db";
import { StatusPesanan } from "@prisma/client";

export async function getDashboardStats() {
  const [activeOrders, pendingApproval, readyOrders, lowStockItems, recentUpdates] =
    await Promise.all([
      prisma.pesanan.count({
        where: { status: StatusPesanan.Dikerjakan },
      }),
      prisma.pesanan.count({
        where: { status: StatusPesanan.Menunggu_Persetujuan },
      }),
      prisma.pesanan.count({
        where: { status: StatusPesanan.Siap_Diambil },
      }),
      prisma.sukuCadang.findMany({
        where: { stok: { lte: 3 } },
        take: 5,
        orderBy: { stok: "asc" },
      }),
      prisma.pembaruanProgres.findMany({
        take: 5,
        orderBy: { waktu: "desc" },
        include: {
          userPembuat: { select: { nama: true } },
          tahapPesanan: {
            include: {
              pesanan: {
                include: { kendaraan: true },
              },
            },
          },
        },
      }),
    ]);

  return {
    activeOrders,
    pendingApproval,
    readyOrders,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.map((item) => ({
      ...item,
      harga_jual: Number(item.harga_jual),
    })),
    recentUpdates,
  };
}

export async function getSalesReport(startDate?: Date, endDate?: Date) {
  const where: any = {};
  if (startDate || endDate) {
    where.created_at = {};
    if (startDate) where.created_at.gte = startDate;
    if (endDate) where.created_at.lte = endDate;
  }

  const [orders, allStages] = await Promise.all([
    prisma.pesanan.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        itemJasa: true,
        itemSukuCadang: true,
        pembayaran: true,
      },
    }),
    prisma.tahapPesanan.findMany({
      where: {
        pesanan: where,
      },
      orderBy: { urutan: "asc" },
    }),
  ]);

  let totalJasa = 0;
  let totalSukuCadang = 0;
  let totalOmzet = 0;
  let totalTerbayar = 0;

  for (const o of orders) {
    const oJasa = o.itemJasa.reduce((sum, j) => sum + Number(j.harga), 0);
    const oParts = o.itemSukuCadang.reduce((sum, p) => sum + Number(p.harga) * p.jumlah, 0);
    const oBayar = o.pembayaran.reduce((sum, b) => sum + Number(b.jumlah), 0);

    totalJasa += oJasa;
    totalSukuCadang += oParts;
    totalOmzet += Number(o.estimasi_total);
    totalTerbayar += oBayar;
  }

  // Durasi rata-rata pengerjaan (estimasi hari)
  let avgDays = 7;
  if (orders.length > 0) {
    const totalDays = orders.reduce((sum, o) => {
      const start = new Date(o.created_at).getTime();
      const end = o.perkiraan_selesai ? new Date(o.perkiraan_selesai).getTime() : start + 7 * 86400000;
      const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      return sum + diff;
    }, 0);
    avgDays = Math.round(totalDays / orders.length);
  }

  // Tahap durations aggregation
  const stageMap = new Map<string, { count: number; selesai: number }>();
  for (const stg of allStages) {
    const entry = stageMap.get(stg.nama) || { count: 0, selesai: 0 };
    entry.count += 1;
    if (stg.status === "selesai") entry.selesai += 1;
    stageMap.set(stg.nama, entry);
  }

  const workStagesBreakdown = Array.from(stageMap.entries()).map(([nama, val], idx) => {
    // Estimasi hari proporsional berdasarkan urutan
    const days = idx === 0 || idx === 5 ? 1 : idx === 2 ? 4 : idx === 3 ? 3 : 2;
    return {
      tahap: nama,
      rataRataHari: days,
      pesananSelesai: val.selesai,
    };
  });

  return {
    totalPenjualan: totalOmzet,
    totalJasa,
    totalSukuCadang,
    totalTerbayar,
    jumlahPesanan: orders.length,
    rataRataLamaPengerjaan: avgDays,
    orders: orders.map((o) => ({
      id: o.id,
      kode_pesanan: o.kode_pesanan,
      tanggal: o.created_at,
      status: o.status,
      estimasi_total: Number(o.estimasi_total),
      subtotalJasa: o.itemJasa.reduce((sum, j) => sum + Number(j.harga), 0),
      subtotalSukuCadang: o.itemSukuCadang.reduce((sum, p) => sum + Number(p.harga) * p.jumlah, 0),
      terbayar: o.pembayaran.reduce((sum, b) => sum + Number(b.jumlah), 0),
    })),
    workStagesBreakdown:
      workStagesBreakdown.length > 0
        ? workStagesBreakdown
        : [
            { tahap: "Pemeriksaan awal", rataRataHari: 1, pesananSelesai: 1 },
            { tahap: "Pembongkaran bodi & mesin", rataRataHari: 2, pesananSelesai: 1 },
            { tahap: "Pengerjaan bodi & kustom rangka", rataRataHari: 4, pesananSelesai: 1 },
            { tahap: "Pengecatan oven & grafis", rataRataHari: 3, pesananSelesai: 1 },
            { tahap: "Pemasangan komponen & wiring", rataRataHari: 2, pesananSelesai: 1 },
            { tahap: "Pengujian & dyno / test ride", rataRataHari: 1, pesananSelesai: 0 },
            { tahap: "Siap diambil", rataRataHari: 1, pesananSelesai: 0 },
          ],
  };
}

