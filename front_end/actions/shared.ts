import { cookies } from "next/headers";
import { z } from "zod";

import type { ActionState } from "@/types/action-state";

export function actionError(error: unknown, fallback: string): ActionState {
  if (error instanceof z.ZodError) {
    return { ok: false, message: error.issues[0]?.message ?? fallback };
  }
  return { ok: false, message: error instanceof Error ? error.message : fallback };
}

export async function cookieStore() {
  return cookies();
}

export async function getGuestId(create = true): Promise<string | undefined> {
  const store = await cookieStore();
  const existing = store.get("guest_id")?.value;
  if (existing) {
    return existing;
  }
  if (!create) {
    return undefined;
  }
  const next = crypto.randomUUID();
  store.set("guest_id", next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return next;
}

export async function authHeaders(): Promise<Record<string, string>> {
  const token = (await cookieStore()).get("session_token")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function formValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
