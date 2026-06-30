import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrder, markOrderPaid } from "@/lib/orders";
import { verifyTransaction } from "@/lib/paystack";
import { AlertIcon } from "@/components/icons";

function PaymentProblem({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-16 text-center">
      <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 mb-4">
        <AlertIcon width={28} height={28} />
      </span>
      <h1 className="font-display font-extrabold text-2xl text-ink">{title}</h1>
      <p className="text-mute mt-2">{message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/cart" className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-6 py-3 transition">
          Back to cart
        </Link>
        <Link href="/account" className="rounded-xl bg-cloud hover:bg-brand-50 text-ink font-semibold px-6 py-3 transition">
          My orders
        </Link>
      </div>
    </div>
  );
}

export default async function PaymentVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const sp = await searchParams;
  const reference = sp.reference || sp.trxref;
  if (!reference) redirect("/cart");

  // Ownership: the order must belong to the signed-in user.
  const order = await getOrder(reference);
  if (!order) {
    return <PaymentProblem title="Order not found" message="We couldn't match this payment to one of your orders." />;
  }

  const verification = await verifyTransaction(reference);
  const succeeded =
    verification?.status === "success" && verification.amount === order.total * 100;

  if (!succeeded) {
    return (
      <PaymentProblem
        title="Payment not completed"
        message="Your payment wasn't successful, so we haven't charged you. You can try again from your cart."
      />
    );
  }

  // Settle the order (idempotent) then send the buyer to their confirmation.
  await markOrderPaid(order.id, reference, verification.amount);
  redirect(`/order-confirmed?order=${order.id}`);
}
