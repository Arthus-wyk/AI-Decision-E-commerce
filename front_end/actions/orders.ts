"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { Order } from "@/types/commerce";

import { authHeaders, formValue, getGuestId } from "./shared";

export async function getOrders(): Promise<Order[]> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    return [];
  }
  return apiFetch<Order[]>("/orders", { headers, cache: "no-store" }).catch(() => []);
}

export async function checkoutAction(formData: FormData) {
  const headers = await authHeaders();
  const order = await apiFetch<Order>("/orders", {
    method: "POST",
    headers,
    body: JSON.stringify({
      email: formValue(formData, "email"),
      full_name: formValue(formData, "full_name"),
      address: formValue(formData, "address"),
      city: formValue(formData, "city"),
      country: formValue(formData, "country"),
      phone: formValue(formData, "phone"),
      guest_id: headers.Authorization ? undefined : await getGuestId(),
    }),
  });
  revalidatePath("/", "layout");
  redirect(`/order-placed?order=${order.id}`);
}
