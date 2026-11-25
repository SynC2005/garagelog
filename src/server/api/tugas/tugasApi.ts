"use server";

import { revalidatePath } from "next/cache";
import {
  addProgressUpdate,
  completeTaskStage,
} from "@/server/services/tugas/tugasService";
import { requireActionPermission } from "@/server/services/auth/rbacService";
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
    const actor = await requireActionPermission("tugas", "kelola");
    const update = await addProgressUpdate({
      ...data,
      dibuatOlehId: actor.id,
    });
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    return { success: true, data: update };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menyimpan pembaruan progres.",
    };
  }
}

export async function completeTaskStageAction(
  tahapPesananId: number
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("tugas", "kelola");
    const res = await completeTaskStage(tahapPesananId);
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    revalidatePath("/pesanan");
    return { success: true, data: res };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menyelesaikan tahap pengerjaan.",
    };
  }
}
