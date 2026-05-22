import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LogOut } from "lucide-react";

import { getCart } from "@/actions/cart";
import { getFavorites } from "@/actions/favorites";
import { getOrders } from "@/actions/orders";
import { getCurrentUser, logoutAction } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function AccountPage() {
  return (
    <main className="w-full px-4 py-7 md:px-8 md:py-8">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent />
      </Suspense>
    </main>
  );
}

async function AccountContent() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const [cart, favorites, orders] = await Promise.all([getCart(), getFavorites(), getOrders()]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">Account</h1>
          <p className="mt-2 text-sm text-slate-500">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            <LogOut />
            Logout
          </Button>
        </form>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          <p className="text-sm text-slate-500">{cart.count} item{cart.count === 1 ? "" : "s"} in cart</p>
          <strong>{formatter.format(cart.subtotal)}</strong>
          <Button asChild className="w-full">
            <Link href="/cart">Review Cart</Link>
          </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Favorites</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          {favorites.length === 0 ? <p className="mt-2 text-sm text-slate-500">No favorites saved.</p> : null}
          {favorites.slice(0, 4).map((product) => (
            <Link className="flex flex-col gap-1 border-t border-slate-200 pt-3 text-slate-950" href={`/products/${product.slug}`} key={product.id}>
              {product.name}
            </Link>
          ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
          {orders.length === 0 ? <p className="mt-2 text-sm text-slate-500">No demo orders yet.</p> : null}
          {orders.map((order) => (
            <article className="flex flex-col gap-1 border-t border-slate-200 pt-3 text-slate-950" key={order.id}>
              <strong>Order #{order.id}</strong>
              <span>{formatter.format(order.subtotal)} · {order.status}</span>
              <small>{order.items.map((item) => `${item.quantity}x ${item.product_name}`).join(", ")}</small>
            </article>
          ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AccountSkeleton() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">Account</h1>
          <p className="mt-2 text-sm text-slate-500">Loading account details...</p>
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
        </section>
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
        </section>
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="h-5 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 animate-pulse rounded-full bg-slate-200" />
        </section>
      </div>
    </>
  );
}
