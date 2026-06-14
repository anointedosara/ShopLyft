import { TruckIcon, ShieldIcon, ReturnIcon, SupportIcon } from "./icons";
import Reveal from "./Reveal";

const items = [
  { icon: <TruckIcon />, title: "Fast delivery", text: "Same-day in major cities" },
  { icon: <ShieldIcon />, title: "Secure payments", text: "100% protected checkout" },
  { icon: <ReturnIcon />, title: "Easy returns", text: "7-day free returns" },
  { icon: <SupportIcon />, title: "24/7 support", text: "We're here to help" },
];

export default function ServiceBar() {
  return (
    <section className="mx-auto max-w-[1280px] px-3 sm:px-5 py-4">
      <Reveal stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3 rounded-2xl bg-white ring-1 ring-line p-4">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand shrink-0">
              {it.icon}
            </span>
            <div>
              <p className="font-semibold text-sm text-ink">{it.title}</p>
              <p className="text-xs text-mute">{it.text}</p>
            </div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
