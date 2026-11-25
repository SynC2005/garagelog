"use server";

import { revalidatePath } from "next/cache";
import {
  createStaffAccount,
  updateStaffAccount,
  toggleStaffActive,
  createStageTemplate,
  updateStageTemplate,
  toggleStagePhotoRequirement,
  reorderStageTemplate,
  updateRolePermissions,
  resetRolePermissionsToDefault,
} from "@/server/services/pengaturan/pengaturanService";
import { requireActionPermission } from "@/server/services/auth/rbacService";
import { PeranUser } from "@prisma/client";
import type { FeatureCode } from "@/lib/rbac";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function revalidateAllProtectedRoutes() {
  revalidatePath("/pengaturan");
  revalidatePath("/dashboard");
  revalidatePath("/pesanan");
  revalidatePath("/tugas");
  revalidatePath("/pelanggan");
  revalidatePath("/jasa");
  revalidatePath("/stok");
  revalidatePath("/laporan");
}

export async function createStaffAccountAction(formData: {
  nama: string;
  email: string;
  kataSandi: string;
  peran: PeranUser;
}): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await createStaffAccount(formData);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal membuat akun staf." };
  }
}

export async function updateStaffAccountAction(
  id: number,
  formData: {
    nama?: string;
    email?: string;
    kataSandi?: string;
    peran?: PeranUser;
  }
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await updateStaffAccount(id, formData);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui akun staf.",
    };
  }
}

export async function toggleStaffActiveAction(
  id: number,
  aktif: boolean
): Promise<ApiResponse<any>> {
  try {
    const actor = await requireActionPermission("pengaturan", "kelola");
    if (actor.id === id && !aktif) {
      return {
        success: false,
        error: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
      };
    }
    const res = await toggleStaffActive(id, aktif);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengubah status aktif staf.",
    };
  }
}

export async function createStageTemplateAction(formData: {
  nama: string;
  wajib_foto?: boolean;
}): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await createStageTemplate(formData);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menambahkan template tahapan.",
    };
  }
}

export async function updateStageTemplateAction(
  id: number,
  formData: { nama?: string; wajib_foto?: boolean }
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await updateStageTemplate(id, formData);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui template tahapan.",
    };
  }
}

export async function toggleStagePhotoRequirementAction(
  id: number,
  wajibFoto: boolean
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await toggleStagePhotoRequirement(id, wajibFoto);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengubah aturan wajib foto.",
    };
  }
}

export async function reorderStageTemplateAction(
  id: number,
  direction: "up" | "down"
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await reorderStageTemplate(id, direction);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mengubah urutan tahapan.",
    };
  }
}

export async function updateRolePermissionsAction(
  peran: PeranUser,
  updates: {
    fitur_kode: FeatureCode;
    dapat_akses: boolean;
    dapat_kelola: boolean;
  }[]
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await updateRolePermissions(peran, updates);
    revalidateAllProtectedRoutes();
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menyimpan konfigurasi hak akses.",
    };
  }
}

export async function resetRolePermissionsAction(
  peran: PeranUser
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await resetRolePermissionsToDefault(peran);
    revalidateAllProtectedRoutes();
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mereset hak akses ke default.",
    };
  }
}
