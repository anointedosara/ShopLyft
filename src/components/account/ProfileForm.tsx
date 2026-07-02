"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/app/actions/profile";
import Avatar from "@/components/Avatar";
import ImageUpload from "@/components/ImageUpload";

type Props = {
  initial: { name: string; phone: string | null; image: string | null };
  email: string;
};

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

export default function ProfileForm({ initial, email }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [image, setImage] = useState(initial.image ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    const res = await updateProfileAction({ name, phone, image });
    setSaving(false);
    if (!res.ok) {
      setMsg({ ok: false, text: res.error });
      return;
    }
    setMsg({ ok: true, text: "Profile updated." });
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={name} image={image} size={64} />
        <p className="text-sm text-mute">This is how you&apos;ll appear across ShopLyft.</p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-ink mb-1.5">Full name</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-ink mb-1.5">Email</label>
        <input value={email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
        <p className="mt-1 text-xs text-mute">Email changes aren&apos;t supported yet.</p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-ink mb-1.5">Phone <span className="text-mute font-normal">(optional)</span></label>
        <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0801 234 5678" className={inputCls} />
      </div>

      <div>
        <span className="block text-sm font-semibold text-ink mb-1.5">Profile photo <span className="text-mute font-normal">(optional)</span></span>
        <ImageUpload
          value={image || null}
          onChange={(url) => setImage(url ?? "")}
          folder="shoplyft/avatars"
          rounded="rounded-full"
          hint="A square photo looks best, up to 10MB"
        />
      </div>

      {msg && (
        <p className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
