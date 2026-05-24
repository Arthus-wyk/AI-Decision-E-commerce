"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus, Pencil } from "lucide-react";
import { Controller, type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createProductAction, updateProductAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initialActionState } from "@/types/action-state";
import type { Product } from "@/types/product";

const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL slug, for example wireless-mouse."),
  brand: z.string().trim().optional(),
  category: z.string().trim().optional(),
  short_description: z.string().trim().optional(),
  description: z.string().trim().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative."),
  stock_quantity: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock cannot be negative."),
  rating: z
    .union([z.literal(""), z.coerce.number().min(0, "Rating must be at least 0.").max(5, "Rating must be 5 or less.")])
    .optional(),
  image_url: z.string().trim().optional(),
  is_active: z.boolean(),
});

type ProductFormInput = z.input<typeof productFormSchema>;
type ProductFormValues = z.output<typeof productFormSchema>;

export function ProductCreateForm() {
  return (
    <ProductDialog
      title="Create product"
      description="Add a new catalog item."
      action={createProductAction}
      successLabel="Product created"
      trigger={
        <Button type="button">
          <PackagePlus />
          New product
        </Button>
      }
    />
  );
}

export function ProductEditForm({ product }: { product: Product }) {
  return (
    <ProductDialog
      key={product.id}
      product={product}
      title="Edit product"
      description="Update product fields and catalog availability."
      action={updateProductAction}
      successLabel="Product updated"
      trigger={
        <Button type="button" variant="ghost" size="sm">
          <Pencil />
          Edit
        </Button>
      }
    />
  );
}

function ProductDialog({
  product,
  title,
  description,
  action,
  successLabel,
  trigger,
}: {
  product?: Product;
  title: string;
  description: string;
  action: typeof createProductAction;
  successLabel: string;
  trigger: React.ReactNode;
}) {
  const fieldPrefix = product ? `product-${product.id}` : "product-new";
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      brand: product?.brand ?? "",
      category: product?.category ?? "",
      short_description: product?.short_description ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      stock_quantity: product?.stock_quantity ?? 0,
      rating: product?.rating ?? "",
      image_url: product?.image_url ?? "",
      is_active: product?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (!state.message) {
      return;
    }
    if (state.ok) {
      toast.success(successLabel, { description: state.message });
      window.setTimeout(() => {
        setOpen(false);
        if (!product) {
          form.reset();
        }
      }, 0);
    } else {
      toast.error(state.message);
    }
  }, [form, product, state, successLabel]);

  function submit(values: ProductFormValues) {
    const formData = new FormData();
    if (product) {
      formData.set("id", String(product.id));
    }
    Object.entries(values).forEach(([key, value]) => {
      if (key === "is_active") {
        if (value) {
          formData.set(key, "on");
        }
        return;
      }
      formData.set(key, value === undefined || value === null ? "" : String(value));
    });
    startTransition(() => formAction(formData));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField methods={form} idPrefix={fieldPrefix} label="Name" name="name" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Slug" name="slug" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Brand" name="brand" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Category" name="category" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Price" name="price" type="number" step="0.01" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Stock" name="stock_quantity" type="number" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Rating" name="rating" type="number" step="0.1" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Image URL" name="image_url" />
            <FormField methods={form} idPrefix={fieldPrefix} label="Short description" name="short_description" className="md:col-span-2" />
            <div className="grid gap-1.5 md:col-span-2">
              <Label htmlFor={`${fieldPrefix}-description`}>Description</Label>
              <Textarea id={`${fieldPrefix}-description`} rows={3} {...form.register("description")} />
              <FieldError message={form.formState.errors.description?.message} />
            </div>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                  Active in catalog
                </label>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  methods,
  idPrefix,
  label,
  name,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  methods: UseFormReturn<ProductFormInput, unknown, ProductFormValues>;
  idPrefix: string;
  label: string;
  name: keyof ProductFormValues;
}) {
  const error = methods.formState.errors[name]?.message;
  return (
    <div className={["grid gap-1.5", className].filter(Boolean).join(" ")}>
      <Label htmlFor={`product-${name}`}>{label}</Label>
      <Input id={`${idPrefix}-${name}`} {...props} {...methods.register(name)} />
      <FieldError message={typeof error === "string" ? error : undefined} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-semibold text-red-600">{message}</p> : null;
}
