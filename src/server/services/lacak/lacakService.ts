import { prisma } from "@/server/db";

/**
 * Service Pelacakan Publik (FR-22 s/d FR-26)
 * Menampilkan linimasa pengerjaan dan status motor pelanggan tanpa login.
 * PRIVASI KETAT: Dilarang menampilkan nomor telepon, alamat lengkap, atau detail rupiah pembayaran.
 */
export async function getPublicTracking(kodePesanan: string) {
  const cleanCode = kodePesanan.trim().toUpperCase();

  const order = await prisma.pesanan.findUnique({
    where: { kode_pesanan: cleanCode },
    include: {
      kendaraan: {
        select: {
          merek: true,
          model: true,
          tahun: true,
          nomor_polisi: true,
        },
      },
      itemJasa: {
        include: {
          jasa: {
            select: { nama: true },
          },
        },
      },
      tahapan: {
        orderBy: { urutan: "asc" },
        select: {
          id: true,
          nama: true,
          urutan: true,
          status: true,
          wajib_foto: true,
          pembaruan: {
            orderBy: { waktu: "desc" },
            select: {
              id: true,
              jenis: true,
              catatan: true,
              waktu: true,
              foto: {
                select: { id: true, url: true },
              },
            },
          },
        },
      },
      pembayaran: {
        select: {
          jumlah: true,
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  // Hitung status pembayaran ringkas (FR-23, FR-28) tanpa membocorkan angka nominal
  const totalPaid = order.pembayaran.reduce((sum, p) => sum + Number(p.jumlah), 0);
  const totalEstimasi = Number(order.estimasi_total);

  let statusBayar: "Belum Bayar" | "Sebagian" | "Lunas" = "Belum Bayar";
  if (totalPaid >= totalEstimasi && totalEstimasi > 0) {
    statusBayar = "Lunas";
  } else if (totalPaid > 0) {
    statusBayar = "Sebagian";
  }

  // Flatten timeline updates secara kronologis
  const timeline: {
    id: number;
    waktu: Date;
    judul: string;
    tahapNama: string;
    tipe: "tahap" | "informasi";
    catatan: string;
    fotos: string[];
  }[] = [];

  for (const t of order.tahapan) {
    for (const p of t.pembaruan) {
      timeline.push({
        id: p.id,
        waktu: p.waktu,
        judul: p.jenis === "informasional" ? "Informasi Pengerjaan" : `Progres: ${t.nama}`,
        tahapNama: t.nama,
        tipe: p.jenis === "informasional" ? "informasi" : "tahap",
        catatan: p.catatan,
        fotos: p.foto.map((f) => f.url),
      });
    }
  }

  // Urutkan dari pembaruan paling mutakhir
  timeline.sort((a, b) => b.waktu.getTime() - a.waktu.getTime());

  return {
    kodePesanan: order.kode_pesanan,
    statusPesanan: order.status,
    perkiraanSelesai: order.perkiraan_selesai,
    kendaraan: {
      merekModel: `${order.kendaraan.merek} ${order.kendaraan.model}`,
      tahun: order.kendaraan.tahun,
      nomorPolisi: order.kendaraan.nomor_polisi,
    },
    daftarModifikasi: order.itemJasa.map((ij) => ij.jasa.nama),
    tahapan: order.tahapan.map((t) => ({
      id: t.id,
      nama: t.nama,
      urutan: t.urutan,
      status: t.status,
      wajibFoto: t.wajib_foto,
    })),
    timeline,
    statusPembayaranRingkas: statusBayar,
  };
}

