import { prisma } from "@/server/db";

export async function getCustomers(search?: string) {
  const where: any = {};
  if (search) {
    where.OR = [
      { nama: { contains: search, mode: "insensitive" } },
      { telepon: { contains: search, mode: "insensitive" } },
    ];
  }

  return await prisma.pelanggan.findMany({
    where,
    orderBy: { nama: "asc" },
    include: {
      kendaraan: true,
      _count: { select: { pesanan: true } },
    },
  });
}

export async function createCustomer(data: { nama: string; telepon: string }) {
  return await prisma.pelanggan.create({
    data: {
      nama: data.nama,
      telepon: data.telepon,
    },
  });
}

export async function updateCustomer(id: number, data: { nama: string; telepon: string }) {
  return await prisma.pelanggan.update({
    where: { id },
    data: {
      nama: data.nama,
      telepon: data.telepon,
    },
  });
}

export async function createVehicle(data: {
  pelangganId: number;
  merek: string;
  model: string;
  tahun: number;
  nomorPolisi: string;
}) {
  return await prisma.kendaraan.create({
    data: {
      pelangganId: data.pelangganId,
      merek: data.merek,
      model: data.model,
      tahun: data.tahun,
      nomor_polisi: data.nomorPolisi.toUpperCase(),
    },
  });
}

export async function updateVehicle(
  id: number,
  data: {
    merek: string;
    model: string;
    tahun: number;
    nomorPolisi: string;
  }
) {
  return await prisma.kendaraan.update({
    where: { id },
    data: {
      merek: data.merek,
      model: data.model,
      tahun: data.tahun,
      nomor_polisi: data.nomorPolisi.toUpperCase(),
    },
  });
}

