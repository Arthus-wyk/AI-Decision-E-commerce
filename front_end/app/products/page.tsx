"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ProductFilter } from "@/components/product/ProductFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductSearchBar } from "@/components/product/ProductSearchBar";
import { getBrands, getCategories, getProducts } from "@/lib/api";
import type { Product, ProductListResponse, ProductQueryParams } from "@/types/product";

const PAGE_SIZE = 12;

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductQueryParams>({
    sort: "newest",
    page: 1,
    page_size: PAGE_SIZE,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let isCurrent = true;

    Promise.all([getCategories(), getBrands()])
      .then(([nextCategories, nextBrands]) => {
        if (!isCurrent) {
          return;
        }
        setCategories(nextCategories);
        setBrands(nextBrands);
      })
      .catch(() => {
        if (isCurrent) {
          setError("Failed to load filters. Please try again later.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    getProducts(filters)
      .then((response: ProductListResponse) => {
        if (!isCurrent) {
          return;
        }
        setProducts(response.items);
        setTotal(response.total);
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }
        setProducts([]);
        setTotal(0);
        setError("Failed to load products. Please try again later.");
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [filters]);

  const handleSearch = useCallback((q: string) => {
    setFilters((current) => ({ ...current, q: q || undefined, page: 1 }));
  }, []);

  const handleFilterChange = useCallback((nextFilters: ProductQueryParams) => {
    setFilters({
      ...nextFilters,
      page: nextFilters.page ?? 1,
      page_size: PAGE_SIZE,
    });
  }, []);

  const resultText = useMemo(() => {
    if (isLoading) {
      return "Loading products...";
    }
    return `${total} product${total === 1 ? "" : "s"} found`;
  }, [isLoading, total]);

  return (
    <main className="page-shell">
      <div className="page-title-row">
        <div>
          <h1>Product Catalog</h1>
          <p>{resultText}</p>
        </div>
      </div>

      <div className="catalog-layout">
        <ProductFilter
          categories={categories}
          brands={brands}
          filters={filters}
          onChange={handleFilterChange}
        />

        <section className="catalog-main" aria-label="Product results">
          <div className="toolbar-card">
            <ProductSearchBar value={filters.q ?? ""} onChange={handleSearch} />
          </div>

          {error ? (
            <div className="state-panel">
              <strong>{error}</strong>
              Backend may not be running yet.
            </div>
          ) : isLoading ? (
            <div className="state-panel">
              <strong>Loading products...</strong>
              Fetching the latest catalog items.
            </div>
          ) : (
            <>
              <ProductGrid products={products} />
              <div className="pagination-row">
                <button
                  className="secondary-button"
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setFilters((current) => ({ ...current, page: Math.max(1, page - 1) }))
                  }
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: Math.min(totalPages, page + 1),
                    }))
                  }
                >
                  Next
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
