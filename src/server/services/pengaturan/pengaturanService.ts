import { prisma } from "@/server/db";
import { PeranUser } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_ROLE_PERMISSIONS,
  RBAC_FEATURES,
  type FeatureCode,
} from "@/lib/rbac";
import { ensureDefaultRolePermissions } from "@/server/services/auth/rbacService";

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
      email: data.email.toLowerCase().trim(),
      kata_sandi_hash: hash,
      peran: data.peran,
      aktif: true,
    },
    select: {
      id: true,
      nama: true,
      email: true,
      peran: true,
      aktif: true,
      created_at: true,
    },
  });
}

export async function toggleStaffActive(id: number, aktif: boolean) {
  return await prisma.user.update({
    where: { id },
    data: { aktif },
    select: {
      id: true,
      nama: true,
      email: true,
      peran: true,
      aktif: true,
    },
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
  const updateData: {
    nama?: string;
    email?: string;
    peran?: PeranUser;
    kata_sandi_hash?: string;
  } = {};
  if (data.nama) updateData.nama = data.nama;
  if (data.email) updateData.email = data.email.toLowerCase().trim();
  if (data.peran) updateData.peran = data.peran;
  if (data.kataSandi && data.kataSandi.trim().length > 0) {
    updateData.kata_sandi_hash = await bcrypt.hash(data.kataSandi, 10);
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nama: true,
      email: true,
      peran: true,
      aktif: true,
    },
  });
}

export async function createStageTemplate(data: {
  nama: string;
  wajib_foto?: boolean;
}) {
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

export async function toggleStagePhotoRequirement(
  id: number,
  wajibFoto: boolean
) {
  return await prisma.templateTahap.update({
    where: { id },
    data: { wajib_foto: wajibFoto },
  });
}

export async function reorderStageTemplate(
  id: number,
  direction: "up" | "down"
) {
  return await prisma.$transaction(async (tx) => {
    const current = await tx.templateTahap.findUnique({ where: { id } });
    if (!current) throw new Error("Template tahap tidak ditemukan.");

    const targetOrder =
      direction === "up" ? current.urutan - 1 : current.urutan + 1;
    const target = await tx.templateTahap.findFirst({
      where: { urutan: targetOrder },
    });

    if (!target) return current;

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

export async function getAllRolePermissions() {
  await ensureDefaultRolePermissions();
  return await prisma.hakAksesPeran.findMany({
    orderBy: [{ peran: "asc" }, { id: "asc" }],
  });
}

export async function updateRolePermissions(
  peran: PeranUser,
  updates: {
    fitur_kode: FeatureCode;
    dapat_akses: boolean;
    dapat_kelola: boolean;
  }[]
) {
  await ensureDefaultRolePermissions();

  return await prisma.$transaction(async (tx) => {
    const featureMap = new Map(RBAC_FEATURES.map((f) => [f.kode, f]));

    for (const item of updates) {
      const meta = featureMap.get(item.fitur_kode);
      if (!meta) continue;

      let canAccess = item.dapat_akses;
      let canManage = canAccess ? item.dapat_kelola : false;

      if (!meta.supportsManage) {
        canManage = canAccess;
      }

      // Safeguard agar akun Admin tidak pernah kehilangan akses Pengaturan
      if (peran === PeranUser.Admin && item.fitur_kode === "pengaturan") {
        canAccess = true;
        canManage = true;
      }

      await tx.hakAksesPeran.upsert({
        where: {
          peran_fitur_kode: {
            peran,
            fitur_kode: item.fitur_kode,
          },
        },
        update: {
          nama_fitur: meta.nama,
          rute: meta.rute,
          dapat_akses: canAccess,
          dapat_kelola: canManage,
        },
        create: {
          peran,
          fitur_kode: item.fitur_kode,
          nama_fitur: meta.nama,
          rute: meta.rute,
          dapat_akses: canAccess,
          dapat_kelola: canManage,
        },
      });
    }

    return await tx.hakAksesPeran.findMany({
      where: { peran },
      orderBy: { id: "asc" },
    });
  });
}

export async function resetRolePermissionsToDefault(peran: PeranUser) {
  const defaults = DEFAULT_ROLE_PERMISSIONS[peran];
  const updates = RBAC_FEATURES.map((f) => ({
    fitur_kode: f.kode,
    dapat_akses: defaults[f.kode].dapat_akses,
    dapat_kelola: defaults[f.kode].dapat_kelola,
  }));
  return await updateRolePermissions(peran, updates);
}
