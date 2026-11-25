import { prisma } from "@/server/db";
import { attachAssignedMechanics } from "@/server/services/pesanan/pesananService";
import {
  JenisPembaruan,
  PeranUser,
  Prisma,
  StatusPesanan,
  StatusTahap,
} from "@prisma/client";

async function assertActorCanAccessStage(
  tx: Prisma.TransactionClient,
  tahapPesananId: number,
  actor?: { id: number; peran: PeranUser }
) {
  const stage = await tx.tahapPesanan.findUnique({
    where: { id: tahapPesananId },
    select: { id: true, pesananId: true },
  });
  if (!stage) {
    throw new Error("Tahap pengerjaan tidak ditemukan.");
  }

  if (actor?.peran === PeranUser.Montir) {
    const rows = await tx.$queryRaw<{ montir_id: number | null }[]>`
      SELECT montir_id
      FROM public.pesanan
      WHERE id = ${stage.pesananId}::int
    `;
    const assignedMontirId = rows[0]?.montir_id ?? null;
    if (assignedMontirId !== actor.id) {
      throw new Error(
        "Akses ditolak: Anda hanya dapat memperbarui tugas pengerjaan yang ditugaskan kepada Anda."
      );
    }
  }
}

/**
 * Ambil daftar tugas pesanan aktif.
 * Jika pengguna berperan Montir, hanya kembalikan pesanan yang ditugaskan kepada montir tersebut.
 */
export async function getActiveTasks(viewer?: {
  userId: number;
  peran: PeranUser;
}) {
  let allowedOrderIds: number[] | null = null;

  if (viewer?.peran === PeranUser.Montir) {
    const assignedRows = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id
      FROM public.pesanan
      WHERE status IN ('Dikerjakan', 'Siap_Diambil')
        AND montir_id = ${viewer.userId}::int
    `;
    allowedOrderIds = assignedRows.map((row) => Number(row.id));
    if (allowedOrderIds.length === 0) {
      return [];
    }
  }

  const rawTasks = await prisma.pesanan.findMany({
    where: {
      status: { in: [StatusPesanan.Dikerjakan, StatusPesanan.Siap_Diambil] },
      ...(allowedOrderIds ? { id: { in: allowedOrderIds } } : {}),
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

  return await attachAssignedMechanics(rawTasks);
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
  actor?: { id: number; peran: PeranUser };
}) {
  return await prisma.$transaction(async (tx) => {
    await assertActorCanAccessStage(tx, data.tahapPesananId, data.actor);

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
export async function completeTaskStage(
  tahapPesananId: number,
  actor?: { id: number; peran: PeranUser }
) {
  return await prisma.$transaction(async (tx) => {
    await assertActorCanAccessStage(tx, tahapPesananId, actor);

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
