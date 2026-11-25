"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  approveAndStartOrder,
  assignMechanicToOrder,
  getOrderByCode,
  recordPayment,
} from "@/server/services/pesanan/pesananService";
import { requireActionPermission } from "@/server/services/auth/rbacService";
import { serializeDecimals } from "@/utils/serialize";
import { ApiResponse } from "@/types/api";
import { MetodePembayaran } from "@prisma/client";

export async function createOrderAction(data: {
  pelangganId: number;
  kendaraanId: number;
  dibuatOlehId: number;
  montirId?: number | null;
  perkiraanSelesai?: string;
  catatan?: string;
  jasaIds: number[];
  sukuCadang: { sukuCadangId: number; jumlah: number; harga: number }[];
  tahapIds: number[];
}): Promise<ApiResponse<any>> {
  try {
    const actor = await requireActionPermission("pesanan", "kelola");
    const order = await createOrder({
      ...data,
      dibuatOlehId: actor.id,
      perkiraanSelesai: data.perkiraanSelesai
        ? new Date(data.perkiraanSelesai)
        : undefined,
    });
    revalidatePath("/pesanan");
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    return { success: true, data: serializeDecimals(order) };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal membuat pesanan.";
    return { success: false, error: message };
  }
}

export async function assignOrderMechanicAction(
  pesananId: number,
  montirId: number | null
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pesanan", "kelola");
    const result = await assignMechanicToOrder(pesananId, montirId);
    revalidatePath("/pesanan");
    revalidatePath(`/pesanan/${result.kode_pesanan}`);
    revalidatePath("/tugas");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Gagal menugaskan montir ke pesanan.";
    return { success: false, error: message };
  }
}

export async function approveOrderAction(
  pesananId: number
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pesanan", "kelola");
    const updated = await approveAndStartOrder(pesananId);
    revalidatePath("/pesanan");
    revalidatePath("/dashboard");
    revalidatePath("/tugas");
    return { success: true, data: serializeDecimals(updated) };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal menyetujui pesanan.";
    return { success: false, error: message };
  }
}

export async function recordPaymentAction(data: {
  pesananId: number;
  jumlah: number;
  metode: MetodePembayaran;
  dicatatOlehId: number;
}): Promise<ApiResponse<any>> {
  try {
    const actor = await requireActionPermission("pembayaran", "kelola");
    const payment = await recordPayment({
      ...data,
      dicatatOlehId: actor.id,
    });
    revalidatePath("/pesanan");
    return { success: true, data: serializeDecimals(payment) };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal mencatat pembayaran.";
    return { success: false, error: message };
  }
}

export async function getOrderByCodeAction(
  kode: string
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("pesanan", "akses");
    const order = await getOrderByCode(kode);
    if (!order) return { success: false, error: "Pesanan tidak ditemukan." };
    return { success: true, data: serializeDecimals(order) };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Gagal mengambil detail pesanan.";
    return { success: false, error: message };
  }
}
