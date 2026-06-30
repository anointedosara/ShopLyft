import "server-only";
import { prisma } from "@/lib/db";

// User data access. Better Auth owns the row; these are our app-level reads/writes
// for profile fields beyond what the session carries (e.g. phone, role).

export async function getProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true, phone: true, role: true },
  });
}

export async function updateUserProfile(
  userId: string,
  data: { name: string; phone?: string | null; image?: string | null }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone: data.phone ?? null,
      image: data.image ?? null,
    },
    select: { id: true },
  });
}
