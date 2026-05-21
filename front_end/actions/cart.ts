"use server";

import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api";
import type { Cart } from "@/types/commerce";

import { authHeaders, formValue, getGuestId } from "./shared";

export async function getCart(): Promise<Cart> {
  const headers = await authHeaders();
  const hasSession = Boolean(headers.Authorization);
  const guestId = hasSession ? undefined : await getGuestId(false);
  if (!hasSession && !guestId) {
    return { items: [], subtotal: 0, count: 0 };
  }
  return apiFetch<Cart>(
    "/cart",
    { headers, cache: "no-store" },
    hasSession ? undefined : { guest_id: guestId },
  ).catch(() => ({ items: [], subtotal: 0, count: 0 }));
}

export async function addToCartAction(formData: FormData) {
  const headers = await authHeaders();
  const productId = Number(formValue(formData, "product_id"));
  const quantity = Number(formValue(formData, "quantity") || "1");
  await apiFetch<Cart>("/cart/items", {
    method: "POST",
    headers,
    body: JSON.stringify({
      product_id: productId,
      quantity,
      guest_id: headers.Authorization ? undefined : await getGuestId(),
    }),
  });
  revalidatePath("/", "layout");
}

export async function updateCartItemAction(formData: FormData) {
  const headers = await authHeaders();
  const productId = Number(formValue(formData, "product_id"));
  const quantity = Number(formValue(formData, "quantity"));
  await apiFetch<Cart>(`/cart/items/${productId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      quantity,
      guest_id: headers.Authorization ? undefined : await getGuestId(),
    }),
  });
  revalidatePath("/", "layout");
}

export async function removeCartItemAction(formData: FormData) {
  const headers = await authHeaders();
  const productId = Number(formValue(formData, "product_id"));
  await apiFetch<Cart>(
    `/cart/items/${productId}`,
    { method: "DELETE", headers },
    headers.Authorization ? undefined : { guest_id: await getGuestId() },
  );
  revalidatePath("/", "layout");
}

export async function clearCartAction() {
  const headers = await authHeaders();
  await apiFetch<Cart>("/cart", {
    method: "DELETE",
    headers,
    body: JSON.stringify({ guest_id: headers.Authorization ? undefined : await getGuestId() }),
  });
  revalidatePath("/", "layout");
}
