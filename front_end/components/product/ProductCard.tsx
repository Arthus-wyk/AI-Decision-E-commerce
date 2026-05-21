import Link from "next/link";

import { addToCartAction } from "@/actions/cart";
import { toggleFavoriteAction } from "@/actions/favorites";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  favorite?: boolean;
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function ProductCard({ product, favorite = false }: ProductCardProps) {
  const imageUrl = product.image_url || "https://placehold.co/600x400?text=Product";
  const inStock = product.stock_quantity > 0;

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl">
      <Link className="block" href={`/products/${product.slug}`}>
        <div className="aspect-[3/2] overflow-hidden border-b border-slate-200 bg-slate-100">
          <img className="h-full w-full object-cover" src={imageUrl} alt={product.name} />
        </div>
      </Link>
      <div className="grid flex-1 gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          {product.category ? (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">
              {product.category}
            </span>
          ) : null}
          {product.brand ? <span>{product.brand}</span> : null}
        </div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-lg font-extrabold leading-tight text-slate-950 transition hover:text-blue-700">
            {product.name}
          </h3>
        </Link>
        {product.short_description ? (
          <p className="line-clamp-2 text-sm leading-6 text-slate-500">{product.short_description}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <span className="block text-xl font-extrabold text-slate-950">{formatter.format(product.price)}</span>
            {product.rating ? (
              <span className="mt-1 block text-xs font-extrabold text-amber-700">Rating {product.rating.toFixed(1)}</span>
            ) : null}
          </div>
          <span
            className={`rounded-full px-2.5 py-1.5 text-xs font-extrabold ${
              inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {inStock ? `${product.stock_quantity} left` : "Out"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <form action={addToCartAction}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-blue-700 px-3 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={!inStock}
            >
              Add to cart
            </button>
          </form>
          <form action={toggleFavoriteAction}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="favorite" value={String(favorite)} />
            <button
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-950 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200"
              type="submit"
              aria-label="Toggle favorite"
            >
              {favorite ? "Saved" : "Save"}
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
