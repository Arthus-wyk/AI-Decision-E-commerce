"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { apiFetch } from "@/lib/api";
import type { User } from "@/types/commerce";

import type { ActionState } from "@/types/action-state";

import { actionError, authHeaders, cookieStore, formValue, getGuestId } from "./shared";

const signinSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const signupSchema = signinSchema.extend({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Name is too long."),
});

export async function getCurrentUser(): Promise<User | null> {
  return apiFetch<User | null>("/users/me", {
    headers: await authHeaders(),
    cache: "no-store",
  }).catch(() => null);
}

export async function signupAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const input = signupSchema.parse({
      email: formValue(formData, "email"),
      password: formValue(formData, "password"),
      name: formValue(formData, "name"),
    });
    const guest_id = await getGuestId();
    const payload = await apiFetch<{ user: User; session_token: string }>("/users/signup", {
      method: "POST",
      body: JSON.stringify({ ...input, guest_id }),
    });
    (await cookieStore()).set("session_token", payload.session_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    revalidatePath("/", "layout");
  } catch (error) {
    return actionError(error, "Could not create your account.");
  }
  redirect("/account");
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const input = signinSchema.parse({
      email: formValue(formData, "email"),
      password: formValue(formData, "password"),
    });
    const guest_id = await getGuestId();
    const payload = await apiFetch<{ user: User; session_token: string }>("/users/login", {
      method: "POST",
      body: JSON.stringify({ ...input, guest_id }),
    });
    (await cookieStore()).set("session_token", payload.session_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    revalidatePath("/", "layout");
  } catch (error) {
    return actionError(error, "Could not sign in.");
  }
  redirect("/account");
}

export async function logoutAction() {
  await apiFetch("/users/logout", { method: "POST", headers: await authHeaders() }).catch(() => null);
  (await cookieStore()).delete("session_token");
  revalidatePath("/", "layout");
  redirect("/products");
}
