"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createAdminProduct,
  setAdminProductActive,
  updateAdminOrder,
  updateAdminProduct,
  updateAdminUser,
} from "@/lib/api";
import type { ActionState } from "@/types/action-state";

import { actionError, authHeaders, formValue } from "./shared";

const nullableText = z
  .string()
  .trim()
  .transform((value) => value || null);

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug, for example wireless-mouse."),
  short_description: nullableText,
  description: nullableText,
  category: nullableText,
  brand: nullableText,
  price: z.coerce.number().min(0, "Price cannot be negative."),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative."),
  image_url: nullableText,
  rating: z
    .string()
    .trim()
    .transform((value) => (value ? Number(value) : null))
    .pipe(z.number().min(0).max(5).nullable()),
  is_active: z.boolean(),
});

const idSchema = z.coerce.number().int().positive();
const statusSchema = z.enum(["demo_created", "processing", "shipped", "cancelled"]);

function productInput(formData: FormData) {
  return productSchema.parse({
    name: formValue(formData, "name"),
    slug: formValue(formData, "slug"),
    short_description: formValue(formData, "short_description"),
    description: formValue(formData, "description"),
    category: formValue(formData, "category"),
    brand: formValue(formData, "brand"),
    price: formValue(formData, "price"),
    stock_quantity: formValue(formData, "stock_quantity"),
    image_url: formValue(formData, "image_url"),
    rating: formValue(formData, "rating"),
    is_active: formData.get("is_active") === "on",
  });
}

export async function createProductAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await createAdminProduct(await authHeaders(), productInput(formData));
    revalidatePath("/admin");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { ok: true, message: "Product created." };
  } catch (error) {
    return actionError(error, "Could not create product.");
  }
}

export async function updateProductAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = idSchema.parse(formValue(formData, "id"));
    await updateAdminProduct(await authHeaders(), id, productInput(formData));
    revalidatePath("/admin");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { ok: true, message: "Product updated." };
  } catch (error) {
    return actionError(error, "Could not update product.");
  }
}

export async function setProductActiveAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = idSchema.parse(formValue(formData, "id"));
    const isActive = formValue(formData, "is_active") === "true";
    await setAdminProductActive(await authHeaders(), id, isActive);
    revalidatePath("/admin");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { ok: true, message: isActive ? "Product activated." : "Product deactivated." };
  } catch (error) {
    return actionError(error, "Could not update product status.");
  }
}

export async function updateUserAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = idSchema.parse(formValue(formData, "id"));
    const field = formValue(formData, "field");
    const value = formValue(formData, "value") === "true";
    if (field !== "is_superadmin" && field !== "is_active") {
      throw new Error("Unsupported user update.");
    }
    await updateAdminUser(await authHeaders(), id, { [field]: value });
    revalidatePath("/admin");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/users");
    return { ok: true, message: "User updated." };
  } catch (error) {
    return actionError(error, "Could not update user.");
  }
}

export async function updateOrderStatusAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = idSchema.parse(formValue(formData, "id"));
    const status = statusSchema.parse(formValue(formData, "status"));
    await updateAdminOrder(await authHeaders(), id, status);
    revalidatePath("/admin");
    revalidatePath("/admin/overview");
    revalidatePath("/admin/orders");
    return { ok: true, message: "Order status updated." };
  } catch (error) {
    return actionError(error, "Could not update order.");
  }
}
