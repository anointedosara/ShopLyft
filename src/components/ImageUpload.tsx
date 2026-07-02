"use client";

import { useRef, useState } from "react";
import { UploadIcon, TrashIcon } from "@/components/icons";

// Reusable image picker for PUBLIC images (product photos, store logos, avatars).
// Picks a file from the device, asks our server for a one-shot Cloudinary
// signature, uploads straight to Cloudinary (the file never touches our server),
// and hands the resulting URL back via onChange. If Cloudinary isn't configured
// it falls back to manual URL entry so the flow still works in dev.
export default function ImageUpload({
  value,
  onChange,
  label,
  hint = "JPG, PNG or WebP, up to 10MB",
  folder = "shoplyft/uploads",
  rounded = "rounded-2xl",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  folder?: string;
  rounded?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateFile: false, folder }),
      });
      const sig = await signRes.json();

      if (!sig.configured) {
        setManual(true);
        setError("Direct upload isn't set up yet — paste an image link instead.");
        return;
      }

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("type", sig.type);

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, {
        method: "POST",
        body: form,
      });
      const up = await upRes.json();
      if (!up.secure_url) {
        setError("Upload failed. Please try again.");
        return;
      }
      onChange(up.secure_url);
      setManual(false);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && <p className="block text-sm font-semibold text-ink mb-1.5">{label}</p>}

      {value ? (
        <div className="flex items-center gap-3">
          {/* Plain img: arbitrary uploaded URL, small preview. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={`w-16 h-16 object-cover ${rounded} ring-1 ring-line shrink-0`} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-cloud ring-1 ring-line hover:ring-brand text-ink text-sm font-semibold px-4 py-2 transition disabled:opacity-60"
            >
              {busy ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={busy}
              className="grid place-items-center rounded-lg text-mute hover:bg-red-50 hover:text-red-600 px-3 transition disabled:opacity-60"
              aria-label="Remove image"
            >
              <TrashIcon width={18} height={18} />
            </button>
          </div>
        </div>
      ) : manual ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://link-to-image…"
            className="flex-1 rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition"
          />
          <button
            type="button"
            onClick={() => manualUrl.trim() && onChange(manualUrl.trim())}
            disabled={!manualUrl.trim()}
            className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-3 text-sm transition disabled:opacity-60"
          >
            Use link
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center gap-3 rounded-xl bg-cloud ring-1 ring-line ring-dashed hover:ring-brand hover:bg-brand-50/40 px-4 py-4 text-left transition disabled:opacity-60"
        >
          <span className="grid place-items-center w-10 h-10 rounded-lg bg-white text-brand ring-1 ring-line shrink-0">
            <UploadIcon width={20} height={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{busy ? "Uploading…" : "Upload from device"}</span>
            <span className="block text-xs text-mute">{hint}</span>
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
