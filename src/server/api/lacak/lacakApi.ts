"use server";

import { getPublicTracking } from "@/server/services/lacak/lacakService";
import { ApiResponse } from "@/types/api";

export async function trackOrderAction(kodePesanan: string): Promise<ApiResponse<any>> {
  try {
    const data = await getPublicTracking(kodePesanan);
    if (!data) {
      return {
        success: false,
        error: "Kode pesanan tidak ditemukan. Periksa kembali kode pada lembar nota Anda.",
      };
    }
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: "Terjadi kesalahan saat mencari pesanan. Silakan coba lagi.",
    };
  }
}

