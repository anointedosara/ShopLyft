"use client";

import { useRef, useState } from "react";
import type { VerificationDocumentType } from "@prisma/client";
import { attachDocumentAction, removeDocumentAction } from "@/app/actions/kyc";
import { UploadIcon, DocumentIcon, CheckIcon, TrashIcon } from "@/components/icons";

// Uploads one KYC document. It asks our server for a one-shot Cloudinary
// signature, uploads the file straight to Cloudinary (so the file never touches
// our server), then records it via attachDocumentAction. If Cloudinary isn't
// configured the component degrades to manual URL entry, so the flow still works
// in dev without an account.

type Uploaded = { id: string; url: string };

export default function FileUpload({
  type,
  label,
  hint,
  privateFile = true,
  initial,
  onChange,
}: {
  type: VerificationDocumentType;
  label: string;
  hint?: string;
  privateFile?: boolean;
  initial?: Uploaded | null;
  onChange?: (value: Uploaded | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<Uploaded | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const set = (v: Uploaded | null) => {
    setValue(v);
    onChange?.(v);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      // 1) Ask our server to sign the upload (or tell us Cloudinary is off).
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateFile }),
      });
      const sig = await signRes.json();

      if (!sig.configured) {
        setManualMode(true);
        setError("Direct upload isn't set up yet — paste a link to your document instead.");
        return;
      }

      // 2) Upload straight to Cloudinary with the signed params.
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

      // 3) Record it against the application.
      await save(up.secure_url, up.public_id ?? null);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const save = async (url: string, publicId: string | null) => {
    const res = await attachDocumentAction({ type, url, publicId });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    set({ id: res.id, url: res.url });
    setManualMode(false);
    setManualUrl("");
  };

  const saveManual = async () => {
    const url = manualUrl.trim();
    if (!url) return;
    setError(null);
    setBusy(true);
    try {
      await save(url, null);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!value) return;
    setBusy(true);
    try {
      await removeDocumentAction(value.id);
      set(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="block text-sm font-semibold text-ink mb-1.5">{label}</p>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            <CheckIcon width={18} height={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800">Document uploaded</p>
            <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700/80 hover:underline truncate block">
              View file
            </a>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="grid place-items-center w-9 h-9 rounded-lg text-mute hover:bg-red-50 hover:text-red-600 transition disabled:opacity-60"
            aria-label="Remove document"
          >
            <TrashIcon width={18} height={18} />
          </button>
        </div>
      ) : manualMode ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://link-to-your-document…"
            className="flex-1 rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition"
          />
          <button
            type="button"
            onClick={saveManual}
            disabled={busy || !manualUrl.trim()}
            className="rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold px-5 py-3 text-sm transition disabled:opacity-60"
          >
            {busy ? "Saving…" : "Use link"}
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
            {busy ? <DocumentIcon width={20} height={20} /> : <UploadIcon width={20} height={20} />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink">{busy ? "Uploading…" : "Upload document"}</span>
            <span className="block text-xs text-mute">{hint ?? "JPG, PNG or PDF, up to 10MB"}</span>
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
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
