import Link from "next/link";
import { requireAdmin } from "@/lib/rbac";
import { ShieldIcon } from "@/components/icons";

export const metadata = { title: "Admin — ShopLyft" };

// Gates the entire /admin section. requireAdmin() redirects anyone who isn't an
// admin (to /login when signed out, home otherwise), so every nested page can
// assume an admin viewer.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-[60vh]">
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-[1100px] px-3 sm:px-5 py-3 flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2 font-display font-bold">
            <ShieldIcon width={20} height={20} /> Admin
          </Link>
          <nav className="flex items-center gap-1 text-sm ml-2">
            <Link href="/admin/sellers" className="px-3 py-1.5 rounded-lg hover:bg-white/10 transition">Sellers</Link>
          </nav>
          <span className="ml-auto text-xs text-white/55 truncate">{admin.email}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
