import { prisma } from "@/server/db";

export async function getServices(search?: string) {
  const where: any = {};
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { deskripsi: { contains: search, mode: "insensitive" } },
    ];
  }

  return await prisma.jasa.findMany({
    where,
    orderBy: { nama: "asc" },
  });
}

export async function createService(data: {
  nama: string;
  deskripsi?: string;
  hargaDasar: number;
}) {
  return await prisma.jasa.create({
    data: {
      nama: data.nama,
      deskripsi: data.deskripsi,
      harga_dasar: data.hargaDasar,
    },
  });
}

export async function updateService(
  id: number,
  data: {
    nama: string;
    deskripsi?: string;
    hargaDasar: number;
  }
) {
  return await prisma.jasa.update({
    where: { id },
    data: {
      nama: data.nama,
      deskripsi: data.deskripsi,
      harga_dasar: data.hargaDasar,
    },
  });
}

