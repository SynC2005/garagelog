"use server";

import { revalidatePath } from "next/cache";
import {
  createService,
  updateService,
} from "@/server/services/jasa/jasaService";
import { requireActionPermission } from "@/server/services/auth/rbacService";
import { ApiResponse } from "@/types/api";
import { serializeDecimals } from "@/utils/serialize";

export async function createServiceAction(data: {
  nama: string;
  deskripsi?: string;
  hargaDasar: number;
}): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("jasa", "kelola");
    const service = await createService(data);
    revalidatePath("/jasa");
    revalidatePath("/pesanan/buat");
    return { success: true, data: serializeDecimals(service) };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menambah jasa." };
  }
}

export async function updateServiceAction(
  id: number,
  data: {
    nama: string;
    deskripsi?: string;
    hargaDasar: number;
  }
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("jasa", "kelola");
    const service = await updateService(id, data);
    revalidatePath("/jasa");
    revalidatePath("/pesanan/buat");
    return { success: true, data: serializeDecimals(service) };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah jasa." };
  }
}
