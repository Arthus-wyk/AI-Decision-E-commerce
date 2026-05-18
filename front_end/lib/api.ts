import type { Product, ProductListResponse, ProductQueryParams } from "@/types/product";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? "/api";

function getApiBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, "");
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const apiBaseUrl = getApiBaseUrl();
  const url = new URL(`${apiBaseUrl}${path}`, window.location.origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return apiBaseUrl.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
  return fetchJson<ProductListResponse>(buildUrl("/products", params));
}

export function getProductBySlug(slug: string): Promise<Product> {
  return fetchJson<Product>(buildUrl(`/products/${encodeURIComponent(slug)}`));
}

export function getCategories(): Promise<string[]> {
  return fetchJson<string[]>(buildUrl("/products/meta/categories"));
}

export function getBrands(): Promise<string[]> {
  return fetchJson<string[]>(buildUrl("/products/meta/brands"));
}
