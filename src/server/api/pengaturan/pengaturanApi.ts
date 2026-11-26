"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
import {
  updateLandingSettings,
  createCustomerReview,
  updateCustomerReview,
  toggleCustomerReviewVisibility,
  reorderCustomerReview,
  deleteCustomerReview,
} from "@/server/services/pengaturan/landingService";
import { requireActionPermission } from "@/server/services/auth/rbacService";
import { PeranUser } from "@prisma/client";
import type { FeatureCode } from "@/lib/rbac";
import type {
  CustomerReviewItem,
  LandingSettingsData,
} from "@/lib/landingDefaults";

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

function revalidateLandingRoutes() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/pengaturan");
  revalidatePath("/masuk");
  revalidatePath("/lacak");
}

const landingSettingsSchema = z.object({
  namaPerusahaan: z.string().trim().min(1, "Nama perusahaan wajib diisi.").max(80),
  taglinePerusahaan: z.string().trim().min(1, "Tagline bengkel wajib diisi.").max(120),
  logoUrl: z.string().nullable(),
  heroBgUrl: z.string().nullable(),
  pemilikNama: z.string().trim().min(1, "Nama pemilik wajib diisi.").max(80),
  pemilikJabatan: z.string().trim().min(1, "Jabatan pemilik wajib diisi.").max(100),
  pemilikFotoUrl: z.string().nullable(),
  pemilikKutipan: z.string().trim().min(1, "Kata-kata pemilik wajib diisi.").max(600),
  tahunBerdiri: z.number().int().min(1950).max(new Date().getFullYear()),
});

const customerReviewSchema = z.object({
  nama: z.string().trim().min(1, "Nama pelanggan wajib diisi.").max(80),
  motor: z.string().trim().min(1, "Tipe motor wajib diisi.").max(100),
  rating: z.number().int().min(1).max(5),
  komentar: z.string().trim().min(1, "Komentar ulasan wajib diisi.").max(500),
  ditampilkan: z.boolean(),
});

export async function updateLandingSettingsAction(
  formData: LandingSettingsData
): Promise<ApiResponse<LandingSettingsData>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const parsed = landingSettingsSchema.parse(formData);
    const res = await updateLandingSettings(parsed);
    revalidateLandingRoutes();
    return { success: true, data: res };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan landing page.",
    };
  }
}

export async function createCustomerReviewAction(formData: {
  nama: string;
  motor: string;
  rating: number;
  komentar: string;
  ditampilkan: boolean;
}): Promise<ApiResponse<CustomerReviewItem>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const parsed = customerReviewSchema.parse(formData);
    const res = await createCustomerReview(parsed);
    revalidateLandingRoutes();
    return { success: true, data: res };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal menambahkan ulasan pelanggan.",
    };
  }
}

export async function updateCustomerReviewAction(
  id: number,
  formData: {
    nama: string;
    motor: string;
    rating: number;
    komentar: string;
    ditampilkan: boolean;
  }
): Promise<ApiResponse<CustomerReviewItem>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const parsed = customerReviewSchema.parse(formData);
    const res = await updateCustomerReview(id, parsed);
    revalidateLandingRoutes();
    return { success: true, data: res };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal memperbarui ulasan pelanggan.",
    };
  }
}

export async function toggleCustomerReviewVisibilityAction(
  id: number,
  ditampilkan: boolean
): Promise<ApiResponse<CustomerReviewItem>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await toggleCustomerReviewVisibility(id, ditampilkan);
    revalidateLandingRoutes();
    return { success: true, data: res };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Gagal mengubah status tampil ulasan.",
    };
  }
}

export async function reorderCustomerReviewAction(
  id: number,
  direction: "up" | "down"
): Promise<ApiResponse<CustomerReviewItem[]>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    const res = await reorderCustomerReview(id, direction);
    revalidateLandingRoutes();
    return { success: true, data: res };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Gagal mengubah urutan ulasan.",
    };
  }
}

export async function deleteCustomerReviewAction(
  id: number
): Promise<ApiResponse<null>> {
  try {
    await requireActionPermission("pengaturan", "kelola");
    await deleteCustomerReview(id);
    revalidateLandingRoutes();
    return { success: true, data: null };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Gagal menghapus ulasan pelanggan.",
    };
  }
}
