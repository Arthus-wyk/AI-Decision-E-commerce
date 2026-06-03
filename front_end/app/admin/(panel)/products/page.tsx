import { redirect } from "next/navigation";

import { createProductAction, deleteProductAction, setProductActiveAction, updateProductAction } from "@/actions/admin";
import { authHeaders } from "@/actions/shared";
import { ActionNotice } from "@/app/admin/_components/action-notice";
import { BrowserConfirmForm } from "@/app/admin/_components/browser-confirm-form";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/data-table";
import { numberOf, optionalBool, valueOf, type AdminSearchParams } from "@/app/admin/_components/page-utils";
import { StatusPill } from "@/app/admin/_components/status-pill";
import { getAdminProducts } from "@/lib/api";
import { initialActionState } from "@/types/action-state";
import type { Product } from "@/types/product";

type PageProps = { searchParams: Promise<AdminSearchParams> };

function redirectWithActionResult(result: { ok: boolean; message: string }) {
  const params = new URLSearchParams({
    notice: result.message,
    notice_type: result.ok ? "success" : "error",
  });
  redirect(`/admin/products?${params.toString()}`);
}

async function createProduct(formData: FormData) {
  "use server";
  redirectWithActionResult(await createProductAction(initialActionState, formData));
}

async function updateProduct(formData: FormData) {
  "use server";
  redirectWithActionResult(await updateProductAction(initialActionState, formData));
}

async function setProductStatus(formData: FormData) {
  "use server";
  redirectWithActionResult(await setProductActiveAction(initialActionState, formData));
}

async function deleteProduct(formData: FormData) {
  "use server";
  redirectWithActionResult(await deleteProductAction(initialActionState, formData));
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = valueOf(params, "q");
  const sort = valueOf(params, "sort", "newest");
  const active = valueOf(params, "active", "all");
  const notice = valueOf(params, "notice");
  const noticeType = valueOf(params, "notice_type");
  const page = numberOf(params, "page", 1);
  const pageSize = numberOf(params, "page_size", 25);
  const products = await getAdminProducts(await authHeaders(), {
    q,
    sort,
    active: optionalBool(active),
    page,
    page_size: pageSize,
  });

  const columns: DataTableColumn<Product>[] = [
    {
      key: "product",
      header: "Product",
      cell: (product) => (
        <div className="min-w-64">
          <p className="font-bold text-slate-950">{product.name}</p>
          <p className="text-xs text-slate-500">{product.slug}</p>
          <ProductEditDetails product={product} />
        </div>
      ),
    },
    { key: "price", header: "Price", cell: (product) => <span className="font-semibold">${product.price.toFixed(2)}</span> },
    { key: "stock", header: "Stock", cell: (product) => product.stock_quantity },
    { key: "status", header: "Status", cell: (product) => <StatusPill active={product.is_active} activeLabel="Active" inactiveLabel="Inactive" /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (product) => (
        <div className="flex justify-end gap-2">
          <form action={setProductStatus}>
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="is_active" value={String(!product.is_active)} />
            <button
              className={
                product.is_active
                  ? "inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                  : "inline-flex h-9 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-950 shadow-sm transition-colors hover:bg-blue-50"
              }
              type="submit"
            >
              {product.is_active ? "Deactivate" : "Activate"}
            </button>
          </form>
          <BrowserConfirmForm action={deleteProduct} message={`Delete "${product.name}"? This cannot be undone.`}>
            <input type="hidden" name="id" value={product.id} />
            <button className="inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700" type="submit">
              Delete
            </button>
          </BrowserConfirmForm>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {notice ? <ActionNotice message={notice} type={noticeType} /> : null}
      <DataTable
        title="Products"
        description="Create, edit, activate, and deactivate catalog items."
        items={products.items}
        columns={columns}
        total={products.total}
        page={products.page}
        pageSize={products.page_size}
        search={q}
        sort={sort}
        sortOptions={[
          { label: "Newest", value: "newest" },
          { label: "Name A-Z", value: "name_asc" },
          { label: "Price low-high", value: "price_asc" },
          { label: "Price high-low", value: "price_desc" },
          { label: "Stock low-high", value: "stock_asc" },
          { label: "Stock high-low", value: "stock_desc" },
        ]}
        filters={[
          {
            name: "active",
            label: "Status",
            value: active,
            options: [
              { label: "All statuses", value: "all" },
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ],
          },
        ]}
        createSlot={<ProductCreateDetails />}
        emptyLabel="No products match the current filters."
        getRowKey={(product) => product.id}
      />
    </div>
  );
}

function ProductCreateDetails() {
  return (
    <details className="rounded-md border border-blue-100 bg-blue-50/40 p-3">
      <summary className="cursor-pointer text-sm font-bold text-blue-700">New product</summary>
      <form action={createProduct} className="mt-4 grid gap-4">
        <ProductFields />
        <button className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700" type="submit">
          Create product
        </button>
      </form>
    </details>
  );
}

function ProductEditDetails({ product }: { product: Product }) {
  return (
    <details className="mt-3 rounded-md border border-blue-100 bg-blue-50/30 p-3">
      <summary className="cursor-pointer text-xs font-bold text-blue-700">Edit</summary>
      <form action={updateProduct} className="mt-4 grid gap-4">
        <input type="hidden" name="id" value={product.id} />
        <ProductFields product={product} />
        <button className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700" type="submit">
          Save product
        </button>
      </form>
    </details>
  );
}

function ProductFields({ product }: { product?: Product }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ProductInput label="Name" name="name" defaultValue={product?.name ?? ""} required />
      <ProductInput label="Slug" name="slug" defaultValue={product?.slug ?? ""} required />
      <ProductInput label="Brand" name="brand" defaultValue={product?.brand ?? ""} />
      <ProductInput label="Category" name="category" defaultValue={product?.category ?? ""} />
      <ProductInput label="Price" name="price" type="number" step="0.01" defaultValue={product?.price ?? 0} required />
      <ProductInput label="Stock" name="stock_quantity" type="number" defaultValue={product?.stock_quantity ?? 0} required />
      <ProductInput label="Rating" name="rating" type="number" step="0.1" defaultValue={product?.rating ?? ""} />
      <ProductInput label="Image URL" name="image_url" defaultValue={product?.image_url ?? ""} />
      <ProductInput label="Short description" name="short_description" defaultValue={product?.short_description ?? ""} className="md:col-span-2" />
      <label className="grid gap-1.5 text-sm font-semibold text-blue-950 md:col-span-2">
        Description
        <textarea
          className="min-h-24 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-normal text-blue-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          name="description"
          defaultValue={product?.description ?? ""}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-blue-950">
        <input className="h-4 w-4 rounded border-blue-200" name="is_active" type="checkbox" defaultChecked={product?.is_active ?? true} />
        Active in catalog
      </label>
    </div>
  );
}

function ProductInput({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <label className={["grid gap-1.5 text-sm font-semibold text-blue-950", className].filter(Boolean).join(" ")}>
      {label}
      <input
        className="h-10 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-normal text-blue-950 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        {...props}
      />
    </label>
  );
}
