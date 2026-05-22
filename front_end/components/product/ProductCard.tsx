import Link from "next/link";
import { Heart, ShoppingCart, Star } from "lucide-react";

import { addToCartAction } from "@/actions/cart";
import { toggleFavoriteAction } from "@/actions/favorites";
import { ActionForm } from "@/components/ActionForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card className="flex min-h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl">
      <Link className="block" href={`/products/${product.slug}`}>
        <div className="aspect-[3/2] overflow-hidden border-b border-blue-100 bg-blue-50">
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
              <span className="mt-1 flex items-center gap-1 text-xs font-extrabold text-amber-700">
                <Star className="h-3.5 w-3.5 fill-current" />
                {product.rating.toFixed(1)}
              </span>
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
          <ActionForm action={addToCartAction}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <Button
              className="w-full"
              size="sm"
              type="submit"
              disabled={!inStock}
            >
              <ShoppingCart />
              Add to cart
            </Button>
          </ActionForm>
          <ActionForm action={toggleFavoriteAction}>
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="favorite" value={String(favorite)} />
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              type="submit"
              aria-label="Toggle favorite"
            >
              <Heart className={favorite ? "fill-current" : ""} />
              {favorite ? "Saved" : "Save"}
            </Button>
          </ActionForm>
        </div>
      </div>
    </Card>
  );
}
