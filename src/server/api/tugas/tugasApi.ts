"use server";

import { revalidatePath } from "next/cache";
import {
  getActiveTasks,
  addProgressUpdate,
  completeTaskStage,
} from "@/server/services/tugas/tugasService";
import { ApiResponse } from "@/types/api";
import { JenisPembaruan } from "@prisma/client";

export async function addProgressUpdateAction(data: {
  tahapPesananId: number;
  jenis: JenisPembaruan;
  catatan: string;
  dibuatOlehId: number;
  fotoUrls?: string[];
}): Promise<ApiResponse<any>> {
  try {
    const update = await addProgressUpdate(data);
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    return { success: true, data: update };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan pembaruan progres." };
  }
}

export async function completeTaskStageAction(tahapPesananId: number): Promise<ApiResponse<any>> {
  try {
    const res = await completeTaskStage(tahapPesananId);
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    revalidatePath("/pesanan");
    return { success: true, data: res };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyelesaikan tahap pengerjaan." };
  }
}

