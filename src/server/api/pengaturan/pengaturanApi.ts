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
} from "@/server/services/pengaturan/pengaturanService";
import { PeranUser } from "@prisma/client";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createStaffAccountAction(formData: {
  nama: string;
  email: string;
  kataSandi: string;
  peran: PeranUser;
}): Promise<ApiResponse<any>> {
  try {
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
    const res = await updateStaffAccount(id, formData);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui akun staf." };
  }
}

export async function toggleStaffActiveAction(
  id: number,
  aktif: boolean
): Promise<ApiResponse<any>> {
  try {
    const res = await toggleStaffActive(id, aktif);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengubah status aktif staf." };
  }
}

export async function createStageTemplateAction(formData: {
  nama: string;
  wajib_foto?: boolean;
}): Promise<ApiResponse<any>> {
  try {
    const res = await createStageTemplate(formData);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal menambahkan template tahapan." };
  }
}

export async function updateStageTemplateAction(
  id: number,
  formData: { nama?: string; wajib_foto?: boolean }
): Promise<ApiResponse<any>> {
  try {
    const res = await updateStageTemplate(id, formData);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memperbarui template tahapan." };
  }
}

export async function toggleStagePhotoRequirementAction(
  id: number,
  wajibFoto: boolean
): Promise<ApiResponse<any>> {
  try {
    const res = await toggleStagePhotoRequirement(id, wajibFoto);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengubah aturan wajib foto." };
  }
}

export async function reorderStageTemplateAction(
  id: number,
  direction: "up" | "down"
): Promise<ApiResponse<any>> {
  try {
    const res = await reorderStageTemplate(id, direction);
    revalidatePath("/pengaturan");
    return { success: true, data: res };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengubah urutan tahapan." };
  }
}

