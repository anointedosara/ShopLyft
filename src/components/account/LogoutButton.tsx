"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={logout}
      className="mt-5 w-full rounded-xl bg-cloud hover:bg-red-50 hover:text-red-600 text-ink-soft font-semibold text-sm py-2.5 transition"
    >
      Log out
    </button>
  );
}
