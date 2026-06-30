import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/orders";
import { getProfile } from "@/lib/users";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProfileForm from "@/components/account/ProfileForm";

export const metadata = { title: "Edit profile — ShopLyft" };

export default async function ProfilePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const profile = await getProfile(sessionUser.id);
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto max-w-[640px] px-3 sm:px-5 py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "My Account", href: "/account" }, { label: "Edit profile" }]} />
      <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-4 mb-5">Edit profile</h1>
      <div className="rounded-2xl bg-white ring-1 ring-line p-6 sm:p-8">
        <ProfileForm
          initial={{ name: profile.name, phone: profile.phone, image: profile.image }}
          email={profile.email}
        />
      </div>
    </div>
  );
}
