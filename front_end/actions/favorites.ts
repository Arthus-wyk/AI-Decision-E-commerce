"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import type { Product } from "@/types/product";

import type { ActionState } from "@/types/action-state";

import { actionError, authHeaders, formValue } from "./shared";

export async function getFavorites(): Promise<Product[]> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    return [];
  }
  return apiFetch<Product[]>("/favorites", { headers, cache: "no-store" }).catch(() => []);
}

export async function toggleFavoriteAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    redirect("/signin");
  }

  try {
    const productId = z.coerce.number().int().positive().parse(formValue(formData, "product_id"));
    const favorite = formValue(formData, "favorite") === "true";
    await apiFetch<Product[]>(`/favorites/${productId}`, {
      method: favorite ? "DELETE" : "POST",
      headers,
    });
    revalidatePath("/", "layout");
    return { ok: true, message: favorite ? "Removed from favorites." : "Saved to favorites.", href: "/account", hrefLabel: "View account" };
  } catch (error) {
    return actionError(error, "Could not update favorites.");
  }
}
