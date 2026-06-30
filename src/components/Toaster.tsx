"use client";

import { useStore } from "@/context/StoreProvider";

export default function Toaster() {
  const { toast } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-ink text-white px-5 py-3 shadow-2xl ring-1 ring-white/10 animate-[float_0.4s_ease-out] max-w-sm"
        >
          <span className="grid place-items-center w-7 h-7 rounded-full bg-brand text-white text-sm">✓</span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
