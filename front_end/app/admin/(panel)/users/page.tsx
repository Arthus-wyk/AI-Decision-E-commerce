import { BadgeCheck } from "lucide-react";

import { updateUserAction } from "@/actions/admin";
import { authHeaders } from "@/actions/shared";
import { getCurrentUser } from "@/actions/user";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/data-table";
import { numberOf, optionalBool, valueOf, type AdminSearchParams } from "@/app/admin/_components/page-utils";
import { StatusPill } from "@/app/admin/_components/status-pill";
import { getAdminUsers } from "@/lib/api";
import { initialActionState } from "@/types/action-state";
import type { User } from "@/types/commerce";

type PageProps = { searchParams: Promise<AdminSearchParams> };

async function updateUser(formData: FormData) {
  "use server";
  await updateUserAction(initialActionState, formData);
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  const q = valueOf(params, "q");
  const sort = valueOf(params, "sort", "newest");
  const active = valueOf(params, "active", "all");
  const role = valueOf(params, "role", "all");
  const page = numberOf(params, "page", 1);
  const pageSize = numberOf(params, "page_size", 25);
  const users = await getAdminUsers(await authHeaders(), {
    q,
    sort,
    active: optionalBool(active),
    role,
    page,
    page_size: pageSize,
  });

  const columns: DataTableColumn<User>[] = [
    {
      key: "user",
      header: "User",
      cell: (user) => (
        <div className="min-w-56">
          <p className="font-bold text-slate-950">{user.name || user.email}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (user) =>
        user.is_superadmin ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            Superadmin
          </span>
        ) : (
          <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Customer</span>
        ),
    },
    { key: "status", header: "Status", cell: (user) => <StatusPill active={user.is_active} activeLabel="Active" inactiveLabel="Inactive" /> },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (user) => {
        const isSelf = user.id === currentUser?.id;
        return (
          <div className="flex min-w-56 justify-end gap-2">
            <form action={updateUser}>
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="field" value="is_superadmin" />
              <input type="hidden" name="value" value={String(!user.is_superadmin)} />
              <button
                className="inline-flex h-9 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-950 shadow-sm transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-50"
                type="submit"
                disabled={isSelf && user.is_superadmin}
              >
                {user.is_superadmin ? "Demote" : "Promote"}
              </button>
            </form>
            <form action={updateUser}>
              <input type="hidden" name="id" value={user.id} />
              <input type="hidden" name="field" value="is_active" />
              <input type="hidden" name="value" value={String(!user.is_active)} />
              <button
                className={
                  user.is_active
                    ? "inline-flex h-9 items-center justify-center rounded-md bg-red-600 px-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
                    : "inline-flex h-9 items-center justify-center rounded-md border border-blue-200 bg-white px-3 text-sm font-semibold text-blue-950 shadow-sm transition-colors hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-50"
                }
                type="submit"
                disabled={isSelf && user.is_active}
              >
                {user.is_active ? "Deactivate" : "Activate"}
              </button>
            </form>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      title="Users"
      description="Search users, filter by access, and manage superadmin status."
      items={users.items}
      columns={columns}
      total={users.total}
      page={users.page}
      pageSize={users.page_size}
      search={q}
      sort={sort}
      sortOptions={[
        { label: "Newest", value: "newest" },
        { label: "Email A-Z", value: "email_asc" },
        { label: "Email Z-A", value: "email_desc" },
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
        {
          name: "role",
          label: "Role",
          value: role,
          options: [
            { label: "All roles", value: "all" },
            { label: "Superadmins", value: "superadmin" },
            { label: "Customers", value: "customer" },
          ],
        },
      ]}
      emptyLabel="No users match the current filters."
      getRowKey={(user) => user.id}
    />
  );
}
