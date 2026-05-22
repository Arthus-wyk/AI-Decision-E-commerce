import "server-only";

import type { AdminOrderList, AdminOverview, AdminUserList, Order, User } from "@/types/commerce";
import type { Product, ProductListResponse } from "@/types/product";

import { apiFetch } from "./core";

type Headers = Record<string, string>;
type Params = Record<string, string | number | boolean | undefined>;

export function getAdminOverview(headers: Headers): Promise<AdminOverview> {
  return apiFetch<AdminOverview>("/admin/overview", { headers, cache: "no-store" });
}

export function getAdminProducts(headers: Headers, params?: Params): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>("/admin/products", { headers, cache: "no-store" }, params);
}

export function createAdminProduct(headers: Headers, body: Record<string, unknown>): Promise<Product> {
  return apiFetch<Product>("/admin/products", { method: "POST", headers, body: JSON.stringify(body) });
}

export function updateAdminProduct(headers: Headers, id: number, body: Record<string, unknown>): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
}

export function setAdminProductActive(headers: Headers, id: number, isActive: boolean): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}/active`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ is_active: isActive }),
  });
}

export function getAdminUsers(headers: Headers, params?: Params): Promise<AdminUserList> {
  return apiFetch<AdminUserList>("/admin/users", { headers, cache: "no-store" }, params);
}

export function updateAdminUser(headers: Headers, id: number, body: Record<string, unknown>): Promise<User> {
  return apiFetch<User>(`/admin/users/${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
}

export function getAdminOrders(headers: Headers, params?: Params): Promise<AdminOrderList> {
  return apiFetch<AdminOrderList>("/admin/orders", { headers, cache: "no-store" }, params);
}

export function updateAdminOrder(headers: Headers, id: number, status: string): Promise<Order> {
  return apiFetch<Order>(`/admin/orders/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status }),
  });
}
