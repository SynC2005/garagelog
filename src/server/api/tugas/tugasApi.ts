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
      actor: { id: actor.id, peran: actor.peran },
    });
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    return { success: true, data: update };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menyimpan pembaruan progres.";
    return { success: false, error: message };
  }
}

export async function completeTaskStageAction(
  tahapPesananId: number
): Promise<ApiResponse<any>> {
  try {
    const actor = await requireActionPermission("tugas", "kelola");
    const res = await completeTaskStage(tahapPesananId, {
      id: actor.id,
      peran: actor.peran,
    });
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    revalidatePath("/pesanan");
    return { success: true, data: res };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menyelesaikan tahap pengerjaan.";
    return { success: false, error: message };
  }
}
