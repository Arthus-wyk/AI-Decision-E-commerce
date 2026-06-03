import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, ShoppingCart } from "lucide-react";

import { addToCartAction } from "@/actions/cart";
import { getFavorites, toggleFavoriteAction } from "@/actions/favorites";
import { getProductBySlug } from "@/lib/api";
import { initialActionState } from "@/types/action-state";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

async function addProductToCart(formData: FormData) {
  "use server";
  await addToCartAction(initialActionState, formData);
}

async function toggleProductFavorite(formData: FormData) {
  "use server";
  await toggleFavoriteAction(initialActionState, formData);
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const [product, favorites] = await Promise.all([getProductBySlug(slug).catch(() => null), getFavorites()]);
  if (!product) {
    notFound();
  }

  const imageUrl = product.image_url || "https://placehold.co/900x650?text=Product";
  const inStock = product.stock_quantity > 0;
  const favorite = favorites.some((item) => item.id === product.id);

  return (
    <main className="w-full px-4 py-7 md:px-8 md:py-8">
      <Link
        className="mb-5 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
        href="/products"
      >
        Back to products
      </Link>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <img className="aspect-[4/3] w-full object-cover" src={imageUrl} alt={product.name} />
        </div>

        <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500">
            {product.category ? <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-blue-700">{product.category}</span> : null}
            {product.brand ? <span>{product.brand}</span> : null}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-slate-950">{product.name}</h1>
          <span className="block text-2xl font-extrabold text-slate-950">{formatter.format(product.price)}</span>
          <span
            className={`w-fit rounded-full px-2.5 py-1.5 text-xs font-extrabold ${
              inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {inStock ? `${product.stock_quantity} in stock` : "Out of stock"}
          </span>
          {product.rating ? <div className="font-extrabold text-amber-700">Rating {product.rating.toFixed(1)}</div> : null}
          <p className="text-sm leading-7 text-slate-500">{product.description}</p>
          <div className="grid gap-3">
            <form action={addProductToCart} className="grid gap-2">
              <input type="hidden" name="product_id" value={product.id} />
              <label className="text-sm font-semibold leading-none text-blue-950" htmlFor="quantity">
                Quantity
              </label>
              <input
                className="flex h-10 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-blue-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                max="99"
                defaultValue="1"
              />
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50"
                type="submit"
                disabled={!inStock}
              >
                <ShoppingCart />
                Add to Cart
              </button>
            </form>
            <form action={toggleProductFavorite}>
              <input type="hidden" name="product_id" value={product.id} />
              <input type="hidden" name="favorite" value={String(favorite)} />
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-950 shadow-sm transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-50"
                type="submit"
              >
                <Heart className={favorite ? "fill-current" : ""} />
                {favorite ? "Remove Favorite" : "Save Favorite"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
