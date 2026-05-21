"use server";

import { apiFetch } from "@/lib/api";
import type { ShopAssistantResponse } from "@/types/commerce";

export async function askShopAssistantAction(message: string, productId?: number): Promise<ShopAssistantResponse> {
  return apiFetch<ShopAssistantResponse>("/shop", {
    method: "POST",
    body: JSON.stringify({ message, product_id: productId }),
    cache: "no-store",
  });
}
