"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

// Fixed 48h window from first client render (avoids SSR hydration mismatch).
// Shared by the homepage FlashSales rail and the dedicated /flash-sales page.
export default function FlashCountdown({ size = "sm" }: { size?: "sm" | "lg" }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = Date.now() + 48 * 60 * 60 * 1000;
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const h = remaining != null ? Math.floor(remaining / 3_600_000) : 0;
  const m = remaining != null ? Math.floor((remaining % 3_600_000) / 60_000) : 0;
  const s = remaining != null ? Math.floor((remaining % 60_000) / 1000) : 0;

  const cell =
    size === "lg"
      ? "min-w-11 h-11 px-2.5 text-lg rounded-xl"
      : "min-w-9 h-9 px-2 text-base rounded-lg";

  return (
    <div className="flex items-center gap-1.5 text-white" suppressHydrationWarning>
      <span className="text-xs text-white/60 mr-1 hidden sm:inline">Ends in</span>
      {[h, m, s].map((unit, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className={`grid place-items-center bg-white/10 ring-1 ring-white/15 font-mono font-bold tabular-nums ${cell}`}>
            {pad(unit)}
          </span>
          {i < 2 && <span className="text-brand font-bold">:</span>}
        </span>
      ))}
    </div>
  );
}
