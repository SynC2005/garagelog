"use server";

import { revalidatePath } from "next/cache";
import {
  adjustStock,
  createPart,
  updatePart,
} from "@/server/services/stok/stokService";
import { requireActionPermission } from "@/server/services/auth/rbacService";
import { JenisPergerakanStok } from "@prisma/client";
import { serializeDecimals } from "@/utils/serialize";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function createPartAction(formData: {
  nama: string;
  SKU: string;
  harga_jual: number;
  stok?: number;
  stok_minimum?: number;
}): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("stok", "kelola");
    const res = await createPart(formData);
    revalidatePath("/stok");
    revalidatePath("/pesanan/buat");
    revalidatePath("/dashboard");
    return { success: true, data: serializeDecimals(res) };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menambahkan suku cadang baru.",
    };
  }
}

export async function updatePartAction(
  id: number,
  data: {
    nama?: string;
    SKU?: string;
    harga_jual?: number;
    stok_minimum?: number;
  }
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("stok", "kelola");
    const res = await updatePart(id, data);
    revalidatePath("/stok");
    revalidatePath("/pesanan/buat");
    return { success: true, data: serializeDecimals(res) };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui suku cadang.",
    };
  }
}

export async function adjustStockAction(formData: {
  sukuCadangId: number;
  jenis: JenisPergerakanStok;
  jumlah: number;
  alasan: string;
}): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("stok", "kelola");
    const res = await adjustStock(formData);
    revalidatePath("/stok");
    revalidatePath("/dashboard");
    return { success: true, data: serializeDecimals(res) };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal mencatat pergerakan stok.",
    };
  }
}
