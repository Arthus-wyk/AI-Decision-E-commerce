import { Suspense } from "react";

import { getFavorites } from "@/actions/favorites";
import { ShoppingAssistantSheet } from "@/components/AI/ShoppingAssistantSheet";
import { CatalogControls } from "@/components/product/CatalogControls";
import { PaginationControls } from "@/components/product/PaginationControls";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getBrands, getCategories, getProducts } from "@/lib/api";
import type { ProductQueryParams } from "@/types/product";

const PAGE_SIZE = 12;

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseParams(
  params: Record<string, string | string[] | undefined>
): ProductQueryParams {
  return {
    q: valueOf(params.q),
    category: valueOf(params.category),
    brand: valueOf(params.brand),
    min_price: valueOf(params.min_price),
    max_price: valueOf(params.max_price),
    in_stock: valueOf(params.in_stock) === "true" ? true : undefined,
    sort: (valueOf(params.sort) as ProductQueryParams["sort"]) ?? "newest",
    page: Number(valueOf(params.page) ?? "1"),
    page_size: PAGE_SIZE,
  };
}

async function Catalog({ params }: { params: ProductQueryParams }) {
  const [products, favorites] = await Promise.all([
    getProducts(params),
    getFavorites(),
  ]);
  const totalPages = Math.max(1, Math.ceil(products.total / PAGE_SIZE));

  return (
    <>
      <div className="mb-4 text-sm font-extrabold text-slate-500">
        <span>
          {products.total} product{products.total === 1 ? "" : "s"} found
        </span>
      </div>
      <ProductGrid
        products={products.items}
        favoriteIds={favorites.map((product) => product.id)}
      />
      {products.total > products.page_size ? (
        <PaginationControls page={products.page} totalPages={totalPages} />
      ) : null}
    </>
  );
}

async function FilterControls() {
  const [categories, brands] = await Promise.all([
    getCategories(),
    getBrands(),
  ]);
  return <CatalogControls categories={categories} brands={brands} />;
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <main className="w-full px-4 py-7 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-normal text-slate-950 md:text-4xl">
            Product Catalog
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Search, filter, save favorites, and build a cart.
          </p>
        </div>
        <ShoppingAssistantSheet />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <Suspense
          fallback={
            <div className="min-h-[420px] rounded-lg border border-slate-200 bg-white shadow-sm" />
          }
        >
          <FilterControls />
        </Suspense>

        <section className="min-w-0" aria-label="Product results">
          <Suspense fallback={<ProductGridSkeleton />}>
            <AsyncCatalog searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

async function AsyncCatalog({ searchParams }: ProductsPageProps) {
  const params = parseParams(await searchParams);
  return <Catalog params={params} />;
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="min-h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          key={index}
        >
          <div className="aspect-[3/2] animate-pulse bg-slate-200" />
          <div className="grid gap-3 p-4">
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
            <div className="h-5 animate-pulse rounded-full bg-slate-200" />
            <div className="h-4 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
