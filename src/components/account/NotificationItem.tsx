"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markNotificationReadAction } from "@/app/actions/notifications";

type Notification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: Date | string;
};

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

// One notification row. Clicking marks it read, then follows its link (if any).
export default function NotificationItem({ n }: { n: Notification }) {
  const router = useRouter();
  const [read, setRead] = useState(n.read);

  const open = async () => {
    if (!read) {
      setRead(true);
      await markNotificationReadAction(n.id);
    }
    if (n.href) router.push(n.href);
    else router.refresh();
  };

  return (
    <button
      onClick={open}
      className={`w-full text-left flex gap-3 rounded-xl p-4 ring-1 transition hover:-translate-y-0.5 ${
        read ? "bg-white ring-line" : "bg-brand-50/60 ring-brand-200"
      }`}
    >
      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${read ? "bg-transparent" : "bg-brand"}`} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${read ? "font-medium text-ink" : "font-bold text-ink"}`}>{n.title}</span>
          <span className="text-xs text-mute shrink-0">{timeAgo(n.createdAt)}</span>
        </span>
        <span className="block text-sm text-mute mt-0.5">{n.body}</span>
      </span>
    </button>
  );
}
