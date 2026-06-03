import { updateOrderStatusAction } from "@/actions/admin";
import { authHeaders } from "@/actions/shared";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/data-table";
import { numberOf, valueOf, type AdminSearchParams } from "@/app/admin/_components/page-utils";
import { getAdminOrders } from "@/lib/api";
import { initialActionState } from "@/types/action-state";
import type { Order } from "@/types/commerce";

type PageProps = { searchParams: Promise<AdminSearchParams> };

async function updateOrderStatus(formData: FormData) {
  "use server";
  await updateOrderStatusAction(initialActionState, formData);
}

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
    {
      key: "items",
      header: "Items",
      cell: (order) => <OrderItems order={order} />,
    },
    {
      key: "subtotal",
      header: "Subtotal",
      cell: (order) => <span className="font-semibold">${order.subtotal.toFixed(2)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (order) => <OrderStatusSelect order={order} />,
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

function OrderItems({ order }: { order: Order }) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <details className="min-w-80 rounded-md border border-blue-100 bg-blue-50/30 p-3">
      <summary className="cursor-pointer text-sm font-bold text-blue-700">
        {totalQuantity} item{totalQuantity === 1 ? "" : "s"} in order
      </summary>
      <ul className="mt-3 grid gap-2">
        {order.items.map((item) => (
          <li key={`${order.id}-${item.product_id}-${item.product_name}`} className="rounded-md border border-slate-200 bg-white p-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{item.product_name}</p>
                <p className="text-xs text-slate-500">Product #{item.product_id}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-slate-950">x{item.quantity}</p>
                <p className="text-xs text-slate-500">${item.unit_price.toFixed(2)} each</p>
              </div>
            </div>
            <p className="mt-2 text-right text-xs font-bold text-slate-600">
              Line total ${(item.unit_price * item.quantity).toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function OrderStatusSelect({ order }: { order: Order }) {
  return (
    <form action={updateOrderStatus} className="grid min-w-44 gap-2">
      <input type="hidden" name="id" value={order.id} />
      <select
        name="status"
        defaultValue={order.status}
        className="h-10 rounded-md border border-blue-200 bg-white px-3 text-sm text-blue-950 shadow-sm"
      >
        <option value="created">Created</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button
        className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        type="submit"
      >
        Save
      </button>
    </form>
  );
}
