"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction, deleteProductAction } from "@/app/actions/products";

type Category = { id: string; name: string };
type Initial = {
  name: string;
  brand: string;
  categoryId: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  image: string | null;
};

const inputCls =
  "w-full rounded-xl bg-cloud px-4 py-3 text-sm text-ink outline-none ring-1 ring-line focus:ring-brand transition";

export default function ProductForm({
  categories,
  productId,
  initial,
}: {
  categories: Category[];
  productId?: string;
  initial?: Initial;
}) {
  const router = useRouter();
  const editing = Boolean(productId);

  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [oldPrice, setOldPrice] = useState(initial?.oldPrice?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock?.toString() ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const values = {
      name,
      brand,
      categoryId,
      price: parseFloat(price),
      oldPrice: oldPrice ? parseFloat(oldPrice) : null,
      stock: parseInt(stock || "0", 10),
      image,
    };
    const res = editing
      ? await updateProductAction(productId!, values)
      : await createProductAction(values);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/seller");
    router.refresh();
  };

  const remove = async () => {
    if (!productId) return;
    setError(null);
    setDeleting(true);
    const res = await deleteProductAction(productId);
    setDeleting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push("/seller");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="p-name" className="block text-sm font-semibold text-ink mb-1.5">Product name</label>
        <input id="p-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="p-brand" className="block text-sm font-semibold text-ink mb-1.5">Brand <span className="text-mute font-normal">(optional)</span></label>
          <input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Defaults to your store name" className={inputCls} />
        </div>
        <div>
          <label htmlFor="p-cat" className="block text-sm font-semibold text-ink mb-1.5">Category</label>
          <select id="p-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="p-price" className="block text-sm font-semibold text-ink mb-1.5">Price (₦)</label>
          <input id="p-price" type="number" min="1" required value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="p-old" className="block text-sm font-semibold text-ink mb-1.5">Was (₦) <span className="text-mute font-normal">(optional)</span></label>
          <input id="p-old" type="number" min="0" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="Shows a discount" className={inputCls} />
        </div>
        <div>
          <label htmlFor="p-stock" className="block text-sm font-semibold text-ink mb-1.5">Stock</label>
          <input id="p-stock" type="number" min="0" required value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="p-image" className="block text-sm font-semibold text-ink mb-1.5">Image URL</label>
        <input id="p-image" type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" className={inputCls} />
        <p className="mt-1 text-xs text-mute">Direct photo upload is coming soon. For now, paste an image link.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving || deleting}
          className="flex-1 rounded-xl bg-brand hover:bg-brand-600 text-white font-semibold py-3 transition active:scale-[0.99] disabled:opacity-60"
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Add product"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={remove}
            disabled={saving || deleting}
            className="rounded-xl bg-cloud hover:bg-red-50 hover:text-red-600 text-ink-soft font-semibold px-5 py-3 transition disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </form>
  );
}
