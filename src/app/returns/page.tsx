import Link from "next/link";
import { getSessionUser, getUserOrders } from "@/lib/orders";
import Breadcrumbs from "@/components/Breadcrumbs";
import ReturnsForm, { type ReturnableOrder } from "@/components/returns/ReturnsForm";
import { LockIcon } from "@/components/icons";

const steps = [
  { n: "1", title: "Pick your order", text: "Choose the order you'd like to return." },
  { n: "2", title: "Tell us why", text: "Select a reason and add any details." },
  { n: "3", title: "We handle the rest", text: "We'll arrange pickup and process your refund." },
];

export default async function ReturnsPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-5 sm:py-8">
        <Breadcrumbs items={[{ label: "Returns & Refunds" }]} />
        <div className="mx-auto mt-6 w-full max-w-md rounded-3xl bg-white ring-1 ring-line p-8 text-center">
          <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-brand-50 text-brand mb-3">
            <LockIcon width={28} height={28} />
          </span>
          <h1 className="font-display font-extrabold text-2xl text-ink">Sign in to start a return</h1>
          <p className="text-mute mt-2">Returns are tied to your orders, so you&apos;ll need to sign in first.</p>
          <Link href="/login" className="inline-flex mt-6 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const dbOrders = await getUserOrders();
  const orders: ReturnableOrder[] = dbOrders.map((o) => ({
    id: o.id,
    shortId: o.id.slice(-8).toUpperCase(),
    date: new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }),
    totalQty: o.items.reduce((a, it) => a + it.qty, 0),
    total: o.total,
  }));

  return (
    <div className="mx-auto max-w-[760px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Returns & Refunds" }]} />

      <div className="mt-4">
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">Returns & Refunds</h1>
        <p className="text-mute mt-1">Eligible items can be returned within 7 days of delivery. Start a request below.</p>
      </div>

      {/* how it works */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl bg-white ring-1 ring-line p-5">
            <span className="grid place-items-center w-9 h-9 rounded-full bg-brand text-white font-display font-bold">{s.n}</span>
            <p className="font-semibold text-ink mt-3">{s.title}</p>
            <p className="text-sm text-mute mt-0.5">{s.text}</p>
          </div>
        ))}
      </div>

      {/* form */}
      <section className="mt-8 rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <h2 className="font-display font-bold text-ink mb-4">Start a return</h2>
        <ReturnsForm orders={orders} />
      </section>
    </div>
  );
}
