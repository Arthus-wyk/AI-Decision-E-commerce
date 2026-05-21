import "server-only";

import type { GroupParams, SessionData } from "@/types/compare";
import type { Product } from "@/types/product";

import { apiFetch, postJson } from "./core";
import { getProductById } from "./products";

export type SessionListResponse = {
  user_id: string;
  sessions: SessionData[];
};

export type HydratedSessionProduct = Product & {
  product_id?: string;
};

export type HydratedCompareSession = Omit<SessionData, "products"> & {
  products: HydratedSessionProduct[];
};

function normalizeProductId(product: unknown): string {
  if (typeof product === "string" || typeof product === "number") {
    return String(product);
  }

  if (product && typeof product === "object") {
    const record = product as Record<string, unknown>;
    const candidate = record.id ?? record.product_id ?? record.productId ?? record.slug ?? record.value;

    if (candidate !== undefined && candidate !== null) {
      return String(candidate);
    }
  }

  return "";
}

export async function getSessions(params: GroupParams): Promise<SessionListResponse> {
  return apiFetch<SessionListResponse>("/sessions", {}, params);
}

export async function hydrateCompareSession(session: SessionData): Promise<HydratedCompareSession> {
  const hydratedProducts = await Promise.all(
    (session.products || [])
      .map((product) => normalizeProductId(product))
      .filter(Boolean)
      .map(async (productId) => {
        try {
          const product = await getProductById(productId);
          return {
            ...product,
            product_id: productId,
          };
        } catch {
          return null;
        }
      }),
  );

  const products = hydratedProducts.filter(Boolean) as HydratedSessionProduct[];

  return {
    ...session,
    products,
  };
}

export async function getHydratedCompareSessions(params: GroupParams): Promise<HydratedCompareSession[]> {
  const payload = await getSessions(params);
  return Promise.all((payload.sessions || []).map((session) => hydrateCompareSession(session)));
}

export type CreateCompareSessionResponse = {
  message?: string;
  session_id: string;
  session?: SessionData;
  data?: SessionData;
};

export async function createCompareSession(input: {
  user_id: string;
  product_id: string;
  name?: string;
}): Promise<CreateCompareSessionResponse> {
  const payload = await postJson<CreateCompareSessionResponse>("/create_session", {
    user_id: input.user_id,
    products: [input.product_id],
    name: input.name,
  });

  const sessionId = payload.session?.session_id || payload.data?.session_id || payload.session_id || "";

  if (!sessionId) {
    throw new Error("Failed to create compare session.");
  }

  return {
    ...payload,
    session_id: sessionId,
  };
}

export async function joinCompareSession(input: {
  session_id: string;
  user_id: string;
  product_id: string;
}): Promise<SessionData> {
  let lastError: Error | null = null;

  try {
    const payload = await postJson<{ session?: SessionData; data?: SessionData; session_id?: string }>("/add_product", {
      session_id: input.session_id,
      user_id: input.user_id,
      product_id: input.product_id,
    });

    if (payload.session) {
      return payload.session;
    }

    if (payload.data) {
      return payload.data;
    }
  } catch (error) {
    lastError = error as Error;
  }

  throw lastError ?? new Error("Failed to join compare session.");
}
