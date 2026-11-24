import { prisma } from "@/server/db";
import { JenisPembaruan, StatusTahap, StatusPesanan } from "@prisma/client";

/**
 * Ambil daftar tugas pesanan yang sedang aktif dikerjakan oleh bengkel
 */
export async function getActiveTasks() {
  return await prisma.pesanan.findMany({
    where: {
      status: { in: [StatusPesanan.Dikerjakan, StatusPesanan.Siap_Diambil] },
    },
    orderBy: { updated_at: "desc" },
    include: {
      pelanggan: true,
      kendaraan: true,
      itemJasa: { include: { jasa: true } },
      tahapan: {
        orderBy: { urutan: "asc" },
        include: {
          pembaruan: {
            include: { foto: true },
          },
        },
      },
    },
  });
}

/**
 * Tambah pembaruan progres (Tahap atau Informasional) (FR-17, FR-19, FR-20)
 * Sifat: Append-Only (Tidak dapat diubah atau dihapus)
 */
export async function addProgressUpdate(data: {
  tahapPesananId: number;
  jenis: JenisPembaruan;
  catatan: string;
  dibuatOlehId: number;
  fotoUrls?: string[];
}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Buat record pembaruan progres
    const update = await tx.pembaruanProgres.create({
      data: {
        tahapPesananId: data.tahapPesananId,
        jenis: data.jenis,
        catatan: data.catatan,
        dibuat_oleh: data.dibuatOlehId,
      },
    });

    // 2. Lampirkan foto bila ada
    if (data.fotoUrls && data.fotoUrls.length > 0) {
      await tx.fotoProgres.createMany({
        data: data.fotoUrls.map((url) => ({
          pembaruanId: update.id,
          url,
        })),
      });
    }

    return update;
  });
}

/**
 * Selesaikan tahap pengerjaan pesanan dengan validasi ketat Wajib Foto (FR-18)
 */
export async function completeTaskStage(tahapPesananId: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Ambil tahap beserta riwayat pembaruan & fotonya
    const stage = await tx.tahapPesanan.findUnique({
      where: { id: tahapPesananId },
      include: {
        pembaruan: {
          include: { foto: true },
        },
        pesanan: {
          include: {
            tahapan: { orderBy: { urutan: "asc" } },
          },
        },
      },
    });

    if (!stage) throw new Error("Tahap pengerjaan tidak ditemukan.");
    if (stage.status === StatusTahap.selesai) {
      throw new Error("Tahap ini sudah berstatus selesai.");
    }

    // 2. Validasi Keras Wajib Foto (FR-18)
    if (stage.wajib_foto) {
      const totalPhotos = stage.pembaruan.reduce(
        (count, p) => count + p.foto.length,
        0
      );
      if (totalPhotos === 0) {
        throw new Error(
          "Validasi Gagal: Tahap ini mewajibkan foto dokumentasi. Unggah minimal 1 foto sebelum menandai selesai."
        );
      }
    }

    // 3. Update tahap saat ini menjadi selesai
    await tx.tahapPesanan.update({
      where: { id: tahapPesananId },
      data: { status: StatusTahap.selesai },
    });

    // 4. Cari tahap berikutnya untuk diubah menjadi 'berjalan'
    const nextStage = stage.pesanan.tahapan.find(
      (t) => t.urutan > stage.urutan && t.status === StatusTahap.belum
    );

    if (nextStage) {
      await tx.tahapPesanan.update({
        where: { id: nextStage.id },
        data: { status: StatusTahap.berjalan },
      });
    } else {
      // Jika semua tahap selesai, status pesanan otomatis menjadi 'Siap Diambil'
      await tx.pesanan.update({
        where: { id: stage.pesananId },
        data: { status: StatusPesanan.Siap_Diambil },
      });
    }

    return { success: true };
  });
}

