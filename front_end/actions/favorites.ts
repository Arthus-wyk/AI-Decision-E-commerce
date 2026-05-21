"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { Product } from "@/types/product";

import { authHeaders, formValue } from "./shared";

export async function getFavorites(): Promise<Product[]> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    return [];
  }
  return apiFetch<Product[]>("/favorites", { headers, cache: "no-store" }).catch(() => []);
}

export async function toggleFavoriteAction(formData: FormData) {
  const productId = Number(formValue(formData, "product_id"));
  const favorite = formValue(formData, "favorite") === "true";
  const headers = await authHeaders();
  if (!headers.Authorization) {
    redirect("/account");
  }
  await apiFetch<Product[]>(`/favorites/${productId}`, {
    method: favorite ? "DELETE" : "POST",
    headers,
  });
  revalidatePath("/", "layout");
}
