"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import type { Cart } from "@/types/commerce";

import type { ActionState } from "@/types/action-state";

import { actionError, authHeaders, formValue, getGuestId } from "./shared";

const cartItemSchema = z.object({
  productId: z.coerce.number().int().positive("Choose a valid product."),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").max(99, "Quantity must be 99 or less."),
});

const bulkCartSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1)
    .max(24),
});

const cartQuantitySchema = z.object({
  productId: z.coerce.number().int().positive("Choose a valid product."),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative.").max(99, "Quantity must be 99 or less."),
});

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

export async function addToCartAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { productId, quantity } = cartItemSchema.parse({
      productId: formValue(formData, "product_id"),
      quantity: formValue(formData, "quantity") || "1",
    });
    const headers = await authHeaders();
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
    revalidatePath("/cart");
    return { ok: true, message: "Added to cart.", href: "/cart", hrefLabel: "Go to cart" };
  } catch (error) {
    return actionError(error, "Could not add this product to cart.");
  }
}

export async function bulkAddToCartAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const parsed = bulkCartSchema.parse({
      items: JSON.parse(formValue(formData, "items") || "[]"),
    });
    const headers = await authHeaders();
    await apiFetch<Cart>("/cart/items/bulk", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...parsed,
        guest_id: headers.Authorization ? undefined : await getGuestId(),
      }),
    });
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    return { ok: true, message: `${parsed.items.length} item${parsed.items.length === 1 ? "" : "s"} added to cart.`, href: "/cart", hrefLabel: "Go to cart" };
  } catch (error) {
    return actionError(error, "Could not add these products to cart.");
  }
}

export async function updateCartItemAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { productId, quantity } = cartQuantitySchema.parse({
      productId: formValue(formData, "product_id"),
      quantity: formValue(formData, "quantity"),
    });
    const headers = await authHeaders();
    await apiFetch<Cart>(`/cart/items/${productId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        quantity,
        guest_id: headers.Authorization ? undefined : await getGuestId(),
      }),
    });
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    return { ok: true, message: quantity === 0 ? "Item removed." : "Cart updated.", href: "/cart", hrefLabel: "View cart" };
  } catch (error) {
    return actionError(error, "Could not update the cart.");
  }
}

export async function removeCartItemAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const productId = z.coerce.number().int().positive().parse(formValue(formData, "product_id"));
    const headers = await authHeaders();
    await apiFetch<Cart>(
      `/cart/items/${productId}`,
      { method: "DELETE", headers },
      headers.Authorization ? undefined : { guest_id: await getGuestId() },
    );
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    return { ok: true, message: "Item removed from cart.", href: "/cart", hrefLabel: "View cart" };
  } catch (error) {
    return actionError(error, "Could not remove this item.");
  }
}

export async function clearCartAction(_state: ActionState, _formData: FormData): Promise<ActionState> {
  void _state;
  void _formData;
  try {
    const headers = await authHeaders();
    await apiFetch<Cart>("/cart", {
      method: "DELETE",
      headers,
      body: JSON.stringify({ guest_id: headers.Authorization ? undefined : await getGuestId() }),
    });
    revalidatePath("/", "layout");
    revalidatePath("/cart");
    return { ok: true, message: "Cart cleared." };
  } catch (error) {
    return actionError(error, "Could not clear the cart.");
  }
}
