"use server";

import { getSalesReport } from "@/server/services/laporan/laporanService";
import { requireActionPermission } from "@/server/services/auth/rbacService";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getFilteredReportAction(
  startDateStr?: string,
  endDateStr?: string
): Promise<ApiResponse<any>> {
  try {
    await requireActionPermission("laporan", "akses");
    const startDate = startDateStr
      ? new Date(`${startDateStr}T00:00:00.000Z`)
      : undefined;
    const endDate = endDateStr
      ? new Date(`${endDateStr}T23:59:59.999Z`)
      : undefined;

    const data = await getSalesReport(startDate, endDate);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal memuat laporan." };
  }
}
