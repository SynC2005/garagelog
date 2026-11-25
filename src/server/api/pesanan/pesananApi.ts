"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  approveAndStartOrder,
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
    revalidatePath("/dashboard");
    return { success: true, data: serializeDecimals(order) };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal membuat pesanan." };
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal menyetujui pesanan.",
    };
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
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal mencatat pembayaran.",
    };
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
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
