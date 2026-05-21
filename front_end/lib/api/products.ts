import "server-only";

import type { Product, ProductListResponse, ProductQueryParams } from "@/types/product";

import { fetchJson } from "./core";

export function getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
  return fetchJson<ProductListResponse>("/products", { cache: "no-store" }, params);
}

export function getProductBySlug(slug: string): Promise<Product> {
  return fetchJson<Product>(`/products/${encodeURIComponent(slug)}`);
}

export function getProductById(id: string): Promise<Product> {
  return fetchJson<Product>(`/products/byId/${encodeURIComponent(id)}`);
}

export function getCategories(): Promise<string[]> {
  return fetchJson<string[]>("/products/meta/categories");
}

export function getBrands(): Promise<string[]> {
  return fetchJson<string[]>("/products/meta/brands");
}
