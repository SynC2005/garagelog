"use server";

import { revalidatePath } from "next/cache";
import {
  createOrder,
  approveAndStartOrder,
  getOrders,
  getOrderByCode,
  recordPayment,
} from "@/server/services/pesanan/pesananService";
import { ApiResponse } from "@/types/api";
import { MetodePembayaran, StatusPesanan } from "@prisma/client";

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
    const order = await createOrder({
      ...data,
      perkiraanSelesai: data.perkiraanSelesai ? new Date(data.perkiraanSelesai) : undefined,
    });
    revalidatePath("/pesanan");
    revalidatePath("/dashboard");
    return { success: true, data: order };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal membuat pesanan." };
  }
}

export async function approveOrderAction(pesananId: number): Promise<ApiResponse<any>> {
  try {
    const updated = await approveAndStartOrder(pesananId);
    revalidatePath("/pesanan");
    revalidatePath("/dashboard");
    revalidatePath("/tugas");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyetujui pesanan." };
  }
}

export async function recordPaymentAction(data: {
  pesananId: number;
  jumlah: number;
  metode: MetodePembayaran;
  dicatatOlehId: number;
}): Promise<ApiResponse<any>> {
  try {
    const payment = await recordPayment(data);
    revalidatePath(`/pesanan`);
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mencatat pembayaran." };
  }
}

export async function getOrderByCodeAction(kode: string): Promise<ApiResponse<any>> {
  try {
    const order = await getOrderByCode(kode);
    if (!order) return { success: false, error: "Pesanan tidak ditemukan." };
    return { success: true, data: order };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

