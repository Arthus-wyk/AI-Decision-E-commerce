"use client";

import type { ProductQueryParams } from "@/types/product";

type ProductFilterProps = {
  categories: string[];
  brands: string[];
  filters: ProductQueryParams;
  onChange: (nextFilters: ProductQueryParams) => void;
};

export function ProductFilter({
  categories,
  brands,
  filters,
  onChange,
}: ProductFilterProps) {
  function updateFilter(key: keyof ProductQueryParams, value: string | boolean | undefined) {
    onChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  }

  return (
    <aside className="filter-panel">
      <h2>Filters</h2>
      <div className="filter-stack">
        <div className="filter-field">
          <label htmlFor="category">Category</label>
          <select
            className="filter-select"
            id="category"
            value={filters.category ?? ""}
            onChange={(event) => updateFilter("category", event.target.value || undefined)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="brand">Brand</label>
          <select
            className="filter-select"
            id="brand"
            value={filters.brand ?? ""}
            onChange={(event) => updateFilter("brand", event.target.value || undefined)}
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="min-price">Min price</label>
          <input
            className="filter-input"
            id="min-price"
            min="0"
            type="number"
            value={filters.min_price ?? ""}
            onChange={(event) => updateFilter("min_price", event.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="max-price">Max price</label>
          <input
            className="filter-input"
            id="max-price"
            min="0"
            type="number"
            value={filters.max_price ?? ""}
            onChange={(event) => updateFilter("max_price", event.target.value)}
          />
        </div>

        <label className="checkbox-field" htmlFor="in-stock">
          <input
            id="in-stock"
            type="checkbox"
            checked={filters.in_stock === true}
            onChange={(event) => updateFilter("in_stock", event.target.checked || undefined)}
          />
          In stock only
        </label>

        <div className="filter-field">
          <label htmlFor="sort">Sort</label>
          <select
            className="filter-select"
            id="sort"
            value={filters.sort ?? "newest"}
            onChange={(event) =>
              updateFilter("sort", event.target.value as ProductQueryParams["sort"])
            }
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Rating</option>
          </select>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() => onChange({ sort: "newest", page: 1, page_size: 12 })}
        >
          Reset filters
        </button>
      </div>
    </aside>
  );
}
