import Link from "next/link";
import { getSessionUser } from "@/lib/orders";
import { listForUser } from "@/lib/notifications";
import Breadcrumbs from "@/components/Breadcrumbs";
import NotificationItem from "@/components/account/NotificationItem";
import MarkAllRead from "@/components/account/MarkAllRead";
import { BellIcon } from "@/components/icons";

export const metadata = { title: "Notifications — ShopLyft" };

export default async function NotificationsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
        <Breadcrumbs items={[{ label: "My Account", href: "/account" }, { label: "Notifications" }]} />
        <div className="mx-auto mt-6 w-full max-w-md rounded-2xl bg-white ring-1 ring-line p-8 text-center">
          <p className="text-sm text-mute">Please sign in to see your notifications.</p>
          <Link href="/login" className="inline-flex mt-4 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-2.5 text-sm transition">Sign in</Link>
        </div>
      </div>
    );
  }

  const notifications = await listForUser(user.id, 50);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "My Account", href: "/account" }, { label: "Notifications" }]} />

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Notifications</h1>
          <p className="text-mute text-sm mt-1">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        <MarkAllRead disabled={unread === 0} />
      </div>

      {notifications.length > 0 ? (
        <ul className="mt-5 space-y-2.5">
          {notifications.map((n) => (
            <li key={n.id}>
              <NotificationItem n={n} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 text-center rounded-2xl bg-white ring-1 ring-line py-14">
          <span className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-cloud text-mute">
            <BellIcon width={24} height={24} />
          </span>
          <p className="text-mute text-sm mt-3">No notifications yet. We&apos;ll let you know when something happens.</p>
        </div>
      )}
    </div>
  );
}
