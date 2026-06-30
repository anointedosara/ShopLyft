"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getUnreadNotificationsCountAction } from "@/app/actions/notifications";
import { BellIcon } from "./icons";

// Header bell with an unread-count badge. Only shown when signed in. Refreshes
// the count on sign-in and whenever the route changes (so visiting the
// notifications page clears it).
export default function NotificationBell() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const userId = session?.user?.id;

  useEffect(() => {
    // When signed out the component renders nothing, so a stale count can't show
    // — only fetch when we have a user (avoids a synchronous reset in the effect).
    if (!userId) return;
    let active = true;
    getUnreadNotificationsCountAction()
      .then((c) => active && setCount(c))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId, pathname]);

  if (!userId) return null;

  return (
    <Link
      href="/account/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="relative flex items-center px-3 py-2 rounded-lg hover:bg-white/15 transition"
    >
      <span className="relative">
        <BellIcon width={20} height={20} />
        {count > 0 && (
          <span
            suppressHydrationWarning
            className="absolute -top-2 -right-2 grid place-items-center min-w-4 h-4 px-1 rounded-full bg-gold text-ink text-[10px] font-bold"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
    </Link>
  );
}
