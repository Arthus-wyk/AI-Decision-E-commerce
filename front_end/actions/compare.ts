"use server";

import { apiFetch, getHydratedCompareSessions, getProductById } from "@/lib/api";
import type { HydratedCompareSession } from "@/lib/api";
import type { SessionData, SessionMessage } from "@/types/compare";
import type { Product } from "@/types/product";

export type CompareSessionPayload = {
  session: SessionData | null;
  messages: SessionMessage[];
  products: Product[];
  summary: string;
  winner: string | null;
  status: string;
};

export async function getCompareGroupsAction(userId = "demo_user"): Promise<HydratedCompareSession[]> {
  return getHydratedCompareSessions({ user_id: userId });
}

export async function loadCompareSessionDataAction(sessionId: string): Promise<CompareSessionPayload> {
  try {
    const [sessionResp, messagesResp, summaryResp, logResp] = await Promise.all([
      apiFetch<{ session: SessionData }>(`/sessions/${sessionId}`, { cache: "no-store" }),
      apiFetch<{ messages: SessionMessage[] }>(`/sessions/${sessionId}/messages`, { cache: "no-store" }),
      apiFetch<{ data: string }>("/summary", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
        cache: "no-store",
      }).catch(() => ({ data: "" })),
      apiFetch<{ logs: { final_result?: { winner?: string } } }>("/session_logs", {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId }),
        cache: "no-store",
      }).catch(() => ({ logs: {} })),
    ]);

    const products = (
      await Promise.all(
        (sessionResp.session.products || []).map((id) => getProductById(String(id)).catch(() => null)),
      )
    ).filter(Boolean) as Product[];

    return {
      session: sessionResp.session,
      messages: messagesResp.messages || [],
      products,
      summary: summaryResp.data || "",
      winner: logResp.logs.final_result?.winner || null,
      status: "Session loaded.",
    };
  } catch (error) {
    return {
      session: null,
      messages: [],
      products: [],
      summary: "",
      winner: null,
      status: (error as Error).message || "Failed to load session.",
    };
  }
}

export async function sendCompareChatAction(input: {
  sessionId: string;
  userId: string;
  message: string;
}): Promise<CompareSessionPayload> {
  await apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({
      session_id: input.sessionId,
      user_id: input.userId || "unknown",
      message: input.message,
      user_profile: {},
    }),
    cache: "no-store",
  });

  const nextData = await loadCompareSessionDataAction(input.sessionId);
  return {
    ...nextData,
    status: "Message sent.",
  };
}
