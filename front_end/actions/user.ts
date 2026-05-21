"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import type { User } from "@/types/commerce";

import { authHeaders, cookieStore, formValue, getGuestId } from "./shared";

export async function getCurrentUser(): Promise<User | null> {
  return apiFetch<User | null>("/users/me", {
    headers: await authHeaders(),
    cache: "no-store",
  }).catch(() => null);
}

export async function signupAction(formData: FormData) {
  const guest_id = await getGuestId();
  const payload = await apiFetch<{ user: User; session_token: string }>("/users/signup", {
    method: "POST",
    body: JSON.stringify({
      email: formValue(formData, "email"),
      password: formValue(formData, "password"),
      name: formValue(formData, "name"),
      guest_id,
    }),
  });
  (await cookieStore()).set("session_token", payload.session_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function loginAction(formData: FormData) {
  const guest_id = await getGuestId();
  const payload = await apiFetch<{ user: User; session_token: string }>("/users/login", {
    method: "POST",
    body: JSON.stringify({
      email: formValue(formData, "email"),
      password: formValue(formData, "password"),
      guest_id,
    }),
  });
  (await cookieStore()).set("session_token", payload.session_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function logoutAction() {
  await apiFetch("/users/logout", { method: "POST", headers: await authHeaders() }).catch(() => null);
  (await cookieStore()).delete("session_token");
  revalidatePath("/", "layout");
  redirect("/products");
}
