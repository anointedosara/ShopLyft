import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

// Server page: reads the token from the (async) search params in Next 16 and
// hands it to the client form. Keeps useSearchParams out of the client tree.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] : sp.token;
  const invalid = Boolean(sp.error) || !token;

  return (
    <div className="mx-auto max-w-[1280px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Sign in", href: "/login" }, { label: "Reset password" }]} />
      <div className="mx-auto mt-6 w-full max-w-md rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <h1 className="font-display font-extrabold text-2xl text-ink">Choose a new password</h1>
        {invalid ? (
          <>
            <p className="text-sm text-mute mt-3">
              This reset link is invalid or has expired. Request a fresh one to continue.
            </p>
            <Link href="/forgot-password" className="mt-6 inline-block font-semibold text-brand hover:underline">
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-mute mt-1">Enter a new password for your account.</p>
            <ResetPasswordForm token={token!} />
          </>
        )}
      </div>
    </div>
  );
}
