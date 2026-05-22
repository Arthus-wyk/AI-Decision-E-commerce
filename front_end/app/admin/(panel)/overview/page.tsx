import type React from "react";
import { Boxes, CircleDollarSign, ShoppingBag, Users } from "lucide-react";

import { authHeaders } from "@/actions/shared";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminOverview } from "@/lib/api";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview(await authHeaders());

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-blue-100 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-950">Overview</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Snapshot of catalog availability, users, orders, and revenue.
        </p>
      </header>
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Admin overview">
        <MetricCard icon={<Boxes className="h-5 w-5" />} label="Products" value={overview.product_count} sub={`${overview.active_product_count} active`} />
        <MetricCard icon={<Users className="h-5 w-5" />} label="Users" value={overview.user_count} sub={`${overview.active_user_count} active`} />
        <MetricCard icon={<ShoppingBag className="h-5 w-5" />} label="Orders" value={overview.order_count} sub="All statuses" />
        <MetricCard icon={<CircleDollarSign className="h-5 w-5" />} label="Revenue" value={`$${overview.revenue_subtotal.toFixed(2)}`} sub="Order subtotal" />
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">{icon}</div>
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="text-2xl font-extrabold text-slate-950">{value}</p>
          <p className="text-xs text-slate-500">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}
