"use client";

import { CheckIcon } from "@/components/icons";

// The "✔ Personal · ✔ Business · ⏳ …" tracker shown above the onboarding form.
// Completed steps are clickable so a seller can jump back and edit.

export type Step = { key: string; label: string };

export default function StepProgress({
  steps,
  currentIndex,
  completedKeys,
  onJump,
}: {
  steps: Step[];
  currentIndex: number;
  completedKeys: string[];
  onJump?: (index: number) => void;
}) {
  return (
    <ol className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
      {steps.map((step, i) => {
        const done = completedKeys.includes(step.key);
        const current = i === currentIndex;
        const reachable = done || current;
        return (
          <li key={step.key} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              disabled={!reachable || !onJump}
              onClick={() => reachable && onJump?.(i)}
              className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 transition ${
                current
                  ? "bg-brand text-white"
                  : done
                    ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : "bg-cloud text-mute"
              } ${reachable && onJump ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`grid place-items-center w-5 h-5 rounded-full text-[11px] font-bold ${
                  current ? "bg-white/20" : done ? "bg-brand text-white" : "bg-line text-mute"
                }`}
              >
                {done && !current ? <CheckIcon width={12} height={12} /> : i + 1}
              </span>
              <span className="text-xs font-semibold whitespace-nowrap">{step.label}</span>
            </button>
            {i < steps.length - 1 && <span className="w-3 sm:w-5 h-px bg-line" />}
          </li>
        );
      })}
    </ol>
  );
}
