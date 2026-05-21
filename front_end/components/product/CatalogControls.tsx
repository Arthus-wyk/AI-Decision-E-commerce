"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type CatalogControlsProps = {
  categories: string[];
  brands: string[];
};

const sortOptions = [
  ["newest", "Newest"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["rating_desc", "Rating"],
];

export function CatalogControls({ categories, brands }: CatalogControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const current = useMemo(() => new URLSearchParams(params.toString()), [params]);

  function navigate(next: URLSearchParams) {
    next.set("page", "1");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function update(key: string, value: string | boolean) {
    const next = new URLSearchParams(current.toString());
    if (value === "" || value === false) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    navigate(next);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update("q", query.trim());
  }

  return (
    <aside className="sticky top-20 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Catalog filters">
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950">Filters</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">Refine the backend catalog query.</p>
        </div>
      </div>
      <form className="grid gap-4 p-4" onSubmit={submitSearch}>
        <div className="grid gap-2">
          <label className="text-sm font-bold text-slate-500" htmlFor="catalog-search">Search</label>
          <div className="flex gap-2">
            <input
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              id="catalog-search"
              type="search"
              value={query}
              placeholder="Search products"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100" type="submit">
              Search
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-bold text-slate-500" htmlFor="category">Category</label>
          <select
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            id="category"
            value={params.get("category") ?? ""}
            onChange={(event) => update("category", event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-bold text-slate-500" htmlFor="brand">Brand</label>
          <select
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            id="brand"
            value={params.get("brand") ?? ""}
            onChange={(event) => update("brand", event.target.value)}
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-bold text-slate-500" htmlFor="min-price">Min price</label>
            <input
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              id="min-price"
              min="0"
              type="number"
              value={params.get("min_price") ?? ""}
              onChange={(event) => update("min_price", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-bold text-slate-500" htmlFor="max-price">Max price</label>
            <input
              className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              id="max-price"
              min="0"
              type="number"
              value={params.get("max_price") ?? ""}
              onChange={(event) => update("max_price", event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="text-sm font-extrabold text-slate-500">Availability</span>
          <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-950" htmlFor="in-stock">
            <span>In stock</span>
            <input
              className="h-5 w-5 rounded border-slate-300 accent-blue-700"
              id="in-stock"
              type="checkbox"
              checked={params.get("in_stock") === "true"}
              onChange={(event) => update("in_stock", event.target.checked)}
            />
          </label>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-bold text-slate-500" htmlFor="sort">Sort</label>
          <select
            className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            id="sort"
            value={params.get("sort") ?? "newest"}
            onChange={(event) => update("sort", event.target.value)}
          >
            {sortOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-slate-200" type="button" onClick={() => router.push(pathname)}>
          Reset filters
        </button>
      </form>
    </aside>
  );
}
