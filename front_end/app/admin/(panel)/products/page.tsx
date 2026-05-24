import { Suspense } from "react";

import { deleteProductAction, setProductActiveAction } from "@/actions/admin";
import { authHeaders } from "@/actions/shared";
import { ConfirmAction } from "@/app/admin/_components/confirm-action";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/data-table";
import { numberOf, optionalBool, valueOf, type AdminSearchParams } from "@/app/admin/_components/page-utils";
import { ProductCreateForm, ProductEditForm } from "@/app/admin/_components/product-form";
import { StatusPill } from "@/app/admin/_components/status-pill";
import { getAdminProducts } from "@/lib/api";
import type { Product } from "@/types/product";
import { DataTableSkeleton } from "@/app/admin/_components/skeletons";

type PageProps = { searchParams: Promise<AdminSearchParams> };

export default function AdminProductsPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <ProductsTable searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsTable({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = valueOf(params, "q");
  const sort = valueOf(params, "sort", "newest");
  const active = valueOf(params, "active", "all");
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
          <ProductEditForm product={product} />
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
          <ConfirmAction
            action={setProductActiveAction}
            title={product.is_active ? "Deactivate product?" : "Activate product?"}
            description={product.is_active ? "This removes the product from the customer catalog." : "This returns the product to the customer catalog."}
            fields={{ id: product.id, is_active: String(!product.is_active) }}
            label={product.is_active ? "Deactivate" : "Activate"}
            variant={product.is_active ? "destructive" : "outline"}
          />
          <ConfirmAction
            action={deleteProductAction}
            title="Delete product?"
            description="This permanently deletes the product when it has no cart, favorite, or order history. Use deactivate for historical products."
            fields={{ id: product.id }}
            label="Delete"
            variant="destructive"
          />
        </div>
      ),
    },
  ];

  return (
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
      createSlot={<ProductCreateForm />}
      emptyLabel="No products match the current filters."
      getRowKey={(product) => product.id}
    />
  );
}
