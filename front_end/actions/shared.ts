import { cookies } from "next/headers";

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
