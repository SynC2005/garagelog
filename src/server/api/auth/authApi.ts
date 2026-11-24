"use server";

import { loginStaff } from "@/server/services/auth/authService";

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function loginStaffAction(formData: {
  email: string;
  kataSandi: string;
}): Promise<ApiResponse<any>> {
  try {
    const user = await loginStaff(formData.email, formData.kataSandi);
    return { success: true, data: user };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal masuk." };
  }
}

