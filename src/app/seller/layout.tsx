import { requireSeller } from "@/lib/rbac";
import SellerNav from "@/components/seller/SellerNav";

// Gates the entire /seller/* subtree: requireSeller redirects signed-out users
// to /login and non-sellers (no store) to /sell — closing the audit finding that
// seller pages checked only for a session, not a seller role. Renders the Seller
// Center nav bar above every seller page.
export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  await requireSeller();
  return (
    <>
      <div className="border-b border-line bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-[1280px] px-3 sm:px-5">
          <SellerNav />
        </div>
      </div>
      {children}
    </>
  );
}
