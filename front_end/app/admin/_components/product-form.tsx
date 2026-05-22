import type React from "react";
import { PackagePlus } from "lucide-react";

import { createProductAction, updateProductAction } from "@/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@/types/product";

export function ProductCreateForm() {
  return (
    <details className="rounded-md border border-blue-100 bg-blue-50/40 p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-extrabold text-blue-800">
        <PackagePlus className="h-4 w-4" />
        New product
      </summary>
      <ActionForm action={createProductAction} successLabel="Product created" className="mt-4">
        <ProductFields />
        <div className="mt-4 flex justify-end">
          <Button type="submit">Create product</Button>
        </div>
      </ActionForm>
    </details>
  );
}

export function ProductEditForm({ product }: { product: Product }) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs font-bold text-blue-700">Edit product</summary>
      <ActionForm action={updateProductAction} successLabel="Product updated" className="mt-3 rounded-md border border-blue-100 p-3">
        <input type="hidden" name="id" value={product.id} />
        <ProductFields product={product} />
        <div className="mt-4 flex justify-end">
          <Button type="submit" size="sm">
            Save changes
          </Button>
        </div>
      </ActionForm>
    </details>
  );
}

function ProductFields({ product }: { product?: Product }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Name" name="name" defaultValue={product?.name} />
      <Field label="Slug" name="slug" defaultValue={product?.slug} />
      <Field label="Brand" name="brand" defaultValue={product?.brand} />
      <Field label="Category" name="category" defaultValue={product?.category} />
      <Field label="Price" name="price" type="number" step="0.01" defaultValue={product?.price ?? 0} />
      <Field label="Stock" name="stock_quantity" type="number" defaultValue={product?.stock_quantity ?? 0} />
      <Field label="Rating" name="rating" type="number" step="0.1" defaultValue={product?.rating ?? ""} />
      <Field label="Image URL" name="image_url" defaultValue={product?.image_url} />
      <Field label="Short description" name="short_description" defaultValue={product?.short_description} className="md:col-span-2" />
      <div className="grid gap-1.5 md:col-span-2">
        <Label htmlFor={`description-${product?.id ?? "new"}`}>Description</Label>
        <Textarea id={`description-${product?.id ?? "new"}`} name="description" defaultValue={product?.description ?? ""} rows={3} />
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Checkbox name="is_active" defaultChecked={product?.is_active ?? true} />
        Active in catalog
      </label>
    </div>
  );
}

function Field({ label, name, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return (
    <div className={["grid gap-1.5", className].filter(Boolean).join(" ")}>
      <Label htmlFor={`${name}-${props.defaultValue ?? "new"}`}>{label}</Label>
      <Input id={`${name}-${props.defaultValue ?? "new"}`} name={name} {...props} />
    </div>
  );
}
