import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);

export const UserIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>
);

export const CartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2.2l2.1 12.4a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.6L21 7H6" /></svg>
);

export const HeartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 20s-7-4.4-9.3-8.4A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5.6C19 15.6 12 20 12 20Z" /></svg>
);

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);

export const ChevronRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
);

export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>
);

export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}><path d="m12 2 2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7Z" /></svg>
);

export const BoltIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" /></svg>
);

export const TruckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>
);

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3 5 6v5c0 5 3.4 8.3 7 9.5 3.6-1.2 7-4.5 7-9.5V6Z" /><path d="m9 12 2 2 4-4" /></svg>
);

export const ReturnIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
);

export const SupportIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 12a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-6h4M4 13h4v6H6a2 2 0 0 1-2-2Z" /></svg>
);
