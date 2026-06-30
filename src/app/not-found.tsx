import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-20 text-center">
      <p className="font-display font-extrabold text-7xl text-gradient">404</p>
      <h1 className="font-display font-bold text-2xl text-ink mt-3">Page not found</h1>
      <p className="text-mute mt-2">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
          Back home
        </Link>
        <Link href="/deals" className="rounded-xl bg-white ring-1 ring-line text-ink font-semibold px-6 py-3 hover:ring-brand-200 transition">
          Shop deals
        </Link>
      </div>
    </div>
  );
}
