import { BadgeCheck } from "lucide-react";

import { updateUserAction } from "@/actions/admin";
import { authHeaders } from "@/actions/shared";
import { getCurrentUser } from "@/actions/user";
import { ConfirmAction } from "@/app/admin/_components/confirm-action";
import { DataTable, type DataTableColumn } from "@/app/admin/_components/data-table";
import { numberOf, optionalBool, valueOf, type AdminSearchParams } from "@/app/admin/_components/page-utils";
import { StatusPill } from "@/app/admin/_components/status-pill";
import { getAdminUsers } from "@/lib/api";
import type { User } from "@/types/commerce";

type PageProps = { searchParams: Promise<AdminSearchParams> };

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
            <ConfirmAction
              action={updateUserAction}
              title={user.is_superadmin ? "Demote superadmin?" : "Promote superadmin?"}
              description={isSelf ? "You cannot demote your own account." : "This changes access to the protected admin panel."}
              fields={{ id: user.id, field: "is_superadmin", value: String(!user.is_superadmin) }}
              label={user.is_superadmin ? "Demote" : "Promote"}
              disabled={isSelf && user.is_superadmin}
            />
            <ConfirmAction
              action={updateUserAction}
              title={user.is_active ? "Deactivate user?" : "Activate user?"}
              description={isSelf ? "You cannot deactivate your own account." : "Deactivated users cannot sign in or use existing sessions."}
              fields={{ id: user.id, field: "is_active", value: String(!user.is_active) }}
              label={user.is_active ? "Deactivate" : "Activate"}
              variant={user.is_active ? "destructive" : "outline"}
              disabled={isSelf && user.is_active}
            />
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
    />
  );
}
