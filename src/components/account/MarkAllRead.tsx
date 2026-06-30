"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";

export default function MarkAllRead({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    await markAllNotificationsReadAction();
    setBusy(false);
    router.refresh();
  };

  return (
    <button
      onClick={run}
      disabled={busy || disabled}
      className="text-sm font-semibold text-brand hover:underline disabled:text-mute disabled:no-underline disabled:cursor-default"
    >
      {busy ? "Marking…" : "Mark all read"}
    </button>
  );
}
