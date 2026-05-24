import { Suspense } from "react";

import { authHeaders } from "@/actions/shared";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/data-table";
import { numberOf, valueOf, type AdminSearchParams } from "@/app/admin/_components/page-utils";
import { getAdminOrders } from "@/lib/api";
import type { Order } from "@/types/commerce";
import { DataTableSkeleton } from "@/app/admin/_components/skeletons";
import { OrderStatusForm } from "@/app/admin/_components/order-status-form";

type PageProps = { searchParams: Promise<AdminSearchParams> };

export default function AdminOrdersPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <OrdersTable searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersTable({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = valueOf(params, "q");
  const sort = valueOf(params, "sort", "newest");
  const status = valueOf(params, "status", "all");
  const page = numberOf(params, "page", 1);
  const pageSize = numberOf(params, "page_size", 25);
  const orders = await getAdminOrders(await authHeaders(), {
    q,
    sort,
    status,
    page,
    page_size: pageSize,
  });

  const columns: DataTableColumn<Order>[] = [
    {
      key: "order",
      header: "Order",
      cell: (order) => (
        <div className="min-w-52">
          <p className="font-bold text-slate-950">Order #{order.id}</p>
          <p className="text-xs text-slate-500">{order.created_at ? new Date(order.created_at).toLocaleString() : "No date"}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (order) => (
        <div className="min-w-56">
          <p className="font-semibold text-slate-950">{order.full_name}</p>
          <p className="text-xs text-slate-500">{order.email}</p>
        </div>
      ),
    },
    { key: "subtotal", header: "Subtotal", cell: (order) => <span className="font-semibold">${order.subtotal.toFixed(2)}</span> },
    { key: "items", header: "Items", cell: (order) => order.items.reduce((sum, item) => sum + item.quantity, 0) },
    {
      key: "status",
      header: "Status",
      cell: (order) => <OrderStatusForm orderId={order.id} status={order.status} />,
    },
  ];

  return (
    <DataTable
      title="Orders"
      description="Search orders, filter by status, and update fulfillment state."
      items={orders.items}
      columns={columns}
      total={orders.total}
      page={orders.page}
      pageSize={orders.page_size}
      search={q}
      sort={sort}
      sortOptions={[
        { label: "Newest", value: "newest" },
        { label: "Oldest", value: "oldest" },
        { label: "Subtotal low-high", value: "subtotal_asc" },
        { label: "Subtotal high-low", value: "subtotal_desc" },
      ]}
      filters={[
        {
          name: "status",
          label: "Status",
          value: status,
          options: [
            { label: "All statuses", value: "all" },
            { label: "Created", value: "created" },
            { label: "Processing", value: "processing" },
            { label: "Shipped", value: "shipped" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
      ]}
      emptyLabel="No orders match the current filters."
      getRowKey={(order) => order.id}
    />
  );
}
