import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Heart, ShoppingCart } from "lucide-react";

import { addToCartAction } from "@/actions/cart";
import { getFavorites, toggleFavoriteAction } from "@/actions/favorites";
import { ActionForm } from "@/components/ActionForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProductBySlug } from "@/lib/api";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type ProductDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  return (
    <main className="w-full px-4 py-7 md:px-8 md:py-8">
      <Button asChild className="mb-5" variant="ghost">
        <Link href="/products">Back to products</Link>
      </Button>
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetail({ params }: ProductDetailsPageProps) {
  const { slug } = await params;
  const [product, favorites] = await Promise.all([getProductBySlug(slug).catch(() => null), getFavorites()]);
  if (!product) {
    notFound();
  }
  const imageUrl = product.image_url || "https://placehold.co/900x650?text=Product";
  const inStock = product.stock_quantity > 0;
  const favorite = favorites.some((item) => item.id === product.id);

  return (
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
          <ActionForm action={addToCartAction} className="grid gap-2">
            <input type="hidden" name="product_id" value={product.id} />
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" name="quantity" type="number" min="1" max="99" defaultValue="1" />
            <Button type="submit" disabled={!inStock}>
              <ShoppingCart />
              Add to Cart
            </Button>
          </ActionForm>
          <ActionForm action={toggleFavoriteAction}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="favorite" value={String(favorite)} />
            <Button className="w-full" variant="outline" type="submit">
              <Heart className={favorite ? "fill-current" : ""} />
              {favorite ? "Remove Favorite" : "Save Favorite"}
            </Button>
          </ActionForm>
        </div>
      </section>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
      <div className="aspect-[4/3] animate-pulse rounded-lg border border-slate-200 bg-slate-200" />
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
        <div className="h-8 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 animate-pulse rounded-full bg-slate-200" />
      </section>
    </div>
  );
}
