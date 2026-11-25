"use server";

import { revalidatePath } from "next/cache";
import {
  createCustomer,
  updateCustomer,
  createVehicle,
  updateVehicle,
} from "@/server/services/pelanggan/pelangganService";
import { requireActionPermission } from "@/server/services/auth/rbacService";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createCustomerAction(formData: {
  nama: string;
  telepon: string;
}): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pelanggan", "kelola");
    const res = await createCustomer(formData);
    revalidatePath("/pelanggan");
    revalidatePath("/pesanan/buat");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal membuat data pelanggan.",
    };
  }
}

export async function updateCustomerAction(
  id: number,
  formData: { nama: string; telepon: string }
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pelanggan", "kelola");
    const res = await updateCustomer(id, formData);
    revalidatePath("/pelanggan");
    revalidatePath("/pesanan/buat");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui data pelanggan.",
    };
  }
}

export async function createVehicleAction(formData: {
  pelangganId: number;
  merek: string;
  model: string;
  tahun: number;
  nomorPolisi: string;
}): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pelanggan", "kelola");
    const res = await createVehicle(formData);
    revalidatePath("/pelanggan");
    revalidatePath("/pesanan/buat");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mendaftarkan kendaraan.",
    };
  }
}

export async function updateVehicleAction(
  id: number,
  formData: {
    merek: string;
    model: string;
    tahun: number;
    nomorPolisi: string;
  }
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pelanggan", "kelola");
    const res = await updateVehicle(id, formData);
    revalidatePath("/pelanggan");
    revalidatePath("/pesanan/buat");
    return { success: true, data: res };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui kendaraan.",
    };
  }
}
