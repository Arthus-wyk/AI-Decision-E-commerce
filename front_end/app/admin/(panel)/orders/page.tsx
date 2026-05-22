import { updateOrderStatusAction } from "@/actions/admin";
import { authHeaders } from "@/actions/shared";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/data-table";
import { numberOf, valueOf, type AdminSearchParams } from "@/app/admin/_components/page-utils";
import { ActionForm } from "@/components/ActionForm";
import { Button } from "@/components/ui/button";
import { getAdminOrders } from "@/lib/api";
import type { Order } from "@/types/commerce";

const statuses = ["demo_created", "processing", "shipped", "cancelled"] as const;

type PageProps = { searchParams: Promise<AdminSearchParams> };

export default async function AdminOrdersPage({ searchParams }: PageProps) {
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
      cell: (order) => (
        <ActionForm action={updateOrderStatusAction} successLabel="Order updated" className="flex min-w-56 gap-2">
          <input type="hidden" name="id" value={order.id} />
          <select name="status" defaultValue={order.status} className="h-9 flex-1 rounded-md border border-blue-200 bg-white px-2 text-sm">
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm">
            Save
          </Button>
        </ActionForm>
      ),
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
            { label: "Demo created", value: "demo_created" },
            { label: "Processing", value: "processing" },
            { label: "Shipped", value: "shipped" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
      ]}
      emptyLabel="No orders match the current filters."
    />
  );
}
