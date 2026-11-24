import { prisma } from "@/server/db";
import { PeranUser } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function getStaffAccounts() {
  return await prisma.user.findMany({
    select: {
      id: true,
      nama: true,
      email: true,
      peran: true,
      aktif: true,
      created_at: true,
    },
    orderBy: { nama: "asc" },
  });
}

export async function createStaffAccount(data: {
  nama: string;
  email: string;
  kataSandi: string;
  peran: PeranUser;
}) {
  const hash = await bcrypt.hash(data.kataSandi, 10);
  return await prisma.user.create({
    data: {
      nama: data.nama,
      email: data.email,
      kata_sandi_hash: hash,
      peran: data.peran,
      aktif: true,
    },
  });
}

export async function toggleStaffActive(id: number, aktif: boolean) {
  return await prisma.user.update({
    where: { id },
    data: { aktif },
  });
}

export async function updateStaffAccount(
  id: number,
  data: {
    nama?: string;
    email?: string;
    kataSandi?: string;
    peran?: PeranUser;
  }
) {
  const updateData: any = {};
  if (data.nama) updateData.nama = data.nama;
  if (data.email) updateData.email = data.email;
  if (data.peran) updateData.peran = data.peran;
  if (data.kataSandi && data.kataSandi.trim().length > 0) {
    updateData.kata_sandi_hash = await bcrypt.hash(data.kataSandi, 10);
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
  });
}

export async function createStageTemplate(data: { nama: string; wajib_foto?: boolean }) {
  const maxOrder = await prisma.templateTahap.aggregate({
    _max: { urutan: true },
  });
  const nextOrder = (maxOrder._max.urutan || 0) + 1;

  return await prisma.templateTahap.create({
    data: {
      nama: data.nama,
      urutan: nextOrder,
      wajib_foto: data.wajib_foto ?? true,
    },
  });
}

export async function updateStageTemplate(
  id: number,
  data: { nama?: string; wajib_foto?: boolean }
) {
  return await prisma.templateTahap.update({
    where: { id },
    data,
  });
}

export async function getStageTemplates() {
  return await prisma.templateTahap.findMany({
    orderBy: { urutan: "asc" },
  });
}

export async function toggleStagePhotoRequirement(id: number, wajibFoto: boolean) {
  return await prisma.templateTahap.update({
    where: { id },
    data: { wajib_foto: wajibFoto },
  });
}

export async function reorderStageTemplate(id: number, direction: "up" | "down") {
  return await prisma.$transaction(async (tx) => {
    const current = await tx.templateTahap.findUnique({ where: { id } });
    if (!current) throw new Error("Template tahap tidak ditemukan.");

    const targetOrder = direction === "up" ? current.urutan - 1 : current.urutan + 1;
    const target = await tx.templateTahap.findFirst({
      where: { urutan: targetOrder },
    });

    if (!target) return current;

    // Swap urutan
    await tx.templateTahap.update({
      where: { id: target.id },
      data: { urutan: current.urutan },
    });

    return await tx.templateTahap.update({
      where: { id: current.id },
      data: { urutan: targetOrder },
    });
  });
}

