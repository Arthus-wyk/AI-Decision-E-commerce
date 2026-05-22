"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CatalogControlsProps = {
  categories: string[];
  brands: string[];
};

const sortOptions = [
  ["newest", "Newest"],
  ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"],
  ["rating_desc", "Rating"],
] as const;

const ALL_VALUE = "__all__";

export function CatalogControls({ categories, brands }: CatalogControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(params.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("max_price") ?? "");

  const current = useMemo(() => new URLSearchParams(params.toString()), [params]);

  const navigate = useCallback((next: URLSearchParams) => {
    next.set("page", "1");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }, [pathname, router]);

  const update = useCallback((key: string, value: string | boolean) => {
    const next = new URLSearchParams(current.toString());
    if (value === "" || value === false || value === ALL_VALUE) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    navigate(next);
  }, [current, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if ((params.get("q") ?? "") !== query.trim()) {
        update("q", query.trim());
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [params, query, update]);

  function applyPrice(key: "min_price" | "max_price", value: string) {
    if ((params.get(key) ?? "") !== value.trim()) {
      update(key, value.trim());
    }
  }

  return (
    <aside className="sticky top-20 overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm" aria-label="Catalog filters">
      <div className="border-b border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-blue-950">Filters</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">Refine the backend catalog query.</p>
          </div>
          {pending ? <Loader2 className="h-5 w-5 animate-spin text-blue-700" aria-label="Loading filters" /> : null}
        </div>
      </div>
      <div className="grid gap-4 p-4">
        <div className="grid gap-2">
          <Label htmlFor="catalog-search">Search</Label>
          <Input
            id="catalog-search"
            type="search"
            value={query}
            placeholder="Search products"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select value={params.get("category") ?? ALL_VALUE} onValueChange={(value) => update("category", value)}>
            <SelectTrigger id="category">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="brand">Brand</Label>
          <Select value={params.get("brand") ?? ALL_VALUE} onValueChange={(value) => update("brand", value)}>
            <SelectTrigger id="brand">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="min-price">Min price</Label>
            <Input
              id="min-price"
              min="0"
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              onBlur={() => applyPrice("min_price", minPrice)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPrice("min_price", minPrice);
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="max-price">Max price</Label>
            <Input
              id="max-price"
              min="0"
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              onBlur={() => applyPrice("max_price", maxPrice)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyPrice("max_price", maxPrice);
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <Label htmlFor="in-stock">In stock</Label>
          <Checkbox
            id="in-stock"
            checked={params.get("in_stock") === "true"}
            onCheckedChange={(checked) => update("in_stock", checked === true)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sort">Sort</Label>
          <Select value={params.get("sort") ?? "newest"} onValueChange={(value) => update("sort", value)}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setQuery("");
            setMinPrice("");
            setMaxPrice("");
            startTransition(() => router.push(pathname));
          }}
        >
          <RotateCcw />
          Reset filters
        </Button>
      </div>
    </aside>
  );
}
