"use server";

import { revalidatePath } from "next/cache";
import {
  getServices,
  createService,
  updateService,
} from "@/server/services/jasa/jasaService";
import { ApiResponse } from "@/types/api";

export async function createServiceAction(data: {
  nama: string;
  deskripsi?: string;
  hargaDasar: number;
}): Promise<ApiResponse<any>> {
  try {
    const service = await createService(data);
    revalidatePath("/jasa");
    revalidatePath("/pesanan/buat");
    return { success: true, data: service };
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
    const service = await updateService(id, data);
    revalidatePath("/jasa");
    revalidatePath("/pesanan/buat");
    return { success: true, data: service };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengubah jasa." };
  }
}

