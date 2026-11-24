import { prisma } from "@/server/db";
import bcrypt from "bcryptjs";

export async function loginStaff(email: string, kataSandi: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new Error("Email atau kata sandi tidak sesuai.");
  }

  if (!user.aktif) {
    throw new Error("Akun ini telah dinonaktifkan. Hubungi administrator.");
  }

  const isMatch = await bcrypt.compare(kataSandi, user.kata_sandi_hash);
  if (!isMatch) {
    throw new Error("Email atau kata sandi tidak sesuai.");
  }

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    peran: user.peran,
  };
}

