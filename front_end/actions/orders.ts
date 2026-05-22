"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import type { Order } from "@/types/commerce";

import type { ActionState } from "@/types/action-state";

import { actionError, authHeaders, formValue, getGuestId } from "./shared";

const checkoutSchema = z.object({
  email: z.string().email("Enter a valid email."),
  full_name: z.string().trim().min(2, "Enter your full name."),
  address: z.string().trim().min(6, "Enter a complete address."),
  city: z.string().trim().min(2, "Enter a city."),
  country: z.string().trim().min(2, "Enter a country."),
  phone: z.string().trim().optional(),
});

export async function getOrders(): Promise<Order[]> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    return [];
  }
  return apiFetch<Order[]>("/orders", { headers, cache: "no-store" }).catch(() => []);
}

export async function checkoutAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  let orderId: number;
  try {
    const input = checkoutSchema.parse({
      email: formValue(formData, "email"),
      full_name: formValue(formData, "full_name"),
      address: formValue(formData, "address"),
      city: formValue(formData, "city"),
      country: formValue(formData, "country"),
      phone: formValue(formData, "phone") || undefined,
    });
    const headers = await authHeaders();
    const order = await apiFetch<Order>("/orders", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...input,
        guest_id: headers.Authorization ? undefined : await getGuestId(),
      }),
    });
    orderId = order.id;
    revalidatePath("/", "layout");
  } catch (error) {
    return actionError(error, "Could not create the order.");
  }
  redirect(`/order-placed?order=${orderId}`);
}
