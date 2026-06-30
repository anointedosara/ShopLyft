import Link from "next/link";

export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-mute flex-wrap">
      <Link href="/" className="hover:text-brand transition">Home</Link>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-line">/</span>
          {it.href ? (
            <Link href={it.href} className="hover:text-brand transition">{it.label}</Link>
          ) : (
            <span className="text-ink font-medium">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
