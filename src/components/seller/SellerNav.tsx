"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartIcon,
  PackageIcon,
  TagIcon,
  WalletIcon,
  SupportIcon,
  ReturnIcon,
  StoreIcon,
  TruckIcon,
  ShieldIcon,
} from "@/components/icons";

type Item = { href: string; label: string; Icon: (p: { width?: number; height?: number }) => React.ReactElement };

const ITEMS: Item[] = [
  { href: "/seller", label: "Dashboard", Icon: ChartIcon },
  { href: "/seller/orders", label: "Orders", Icon: PackageIcon },
  { href: "/seller/coupons", label: "Coupons", Icon: TagIcon },
  { href: "/seller/wallet", label: "Wallet", Icon: WalletIcon },
  { href: "/seller/returns", label: "Returns", Icon: ReturnIcon },
  { href: "/seller/messages", label: "Messages", Icon: SupportIcon },
  { href: "/seller/settings", label: "Settings", Icon: StoreIcon },
  { href: "/seller/shipping", label: "Shipping", Icon: TruckIcon },
  { href: "/seller/verification", label: "Verification", Icon: ShieldIcon },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/seller") return pathname === "/seller";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SellerNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Seller Center"
      className="flex gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
              active ? "bg-brand text-white" : "text-ink-soft hover:bg-cloud"
            }`}
          >
            <Icon width={18} height={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
