"use server";

import { loginStaff } from "@/server/services/auth/authService";
import {
  clearSessionCookie,
  setSessionCookie,
} from "@/server/services/auth/sessionService";
import {
  buildAllowedFeaturesMap,
  getPermissionsForRole,
} from "@/server/services/auth/rbacService";
import { getDefaultRouteForPermissions } from "@/lib/rbac";

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
    await setSessionCookie(user);

    const permissions = await getPermissionsForRole(user.peran);
    const allowedFeatures = buildAllowedFeaturesMap(permissions);
    const defaultRoute = getDefaultRouteForPermissions(
      user.peran,
      allowedFeatures
    );

    return {
      success: true,
      data: {
        ...user,
        defaultRoute,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal masuk." };
  }
}

export async function logoutStaffAction(): Promise<ApiResponse<null>> {
  await clearSessionCookie();
  return { success: true, data: null };
}
