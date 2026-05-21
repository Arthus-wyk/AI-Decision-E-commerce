import type { Product } from "@/types/product";

import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: Product[];
  favoriteIds?: number[];
};

export function ProductGrid({ products, favoriteIds = [] }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        <strong className="mb-2 block text-slate-950">No products found.</strong>
        <span>Try a different keyword or filter combination.</span>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} favorite={favoriteIds.includes(product.id)} />
      ))}
    </div>
  );
}
