import Link from "next/link";
import { Suspense } from "react";

import { getCart } from "@/actions/cart";
import { getFavorites } from "@/actions/favorites";
import { getOrders } from "@/actions/orders";
import { getCurrentUser, loginAction, logoutAction, signupAction } from "@/actions/user";

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
    return (
      <>
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">Account</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to save favorites, merge your guest cart, and view orders.</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" action={loginAction}>
            <h2 className="text-xl font-extrabold text-slate-950">Login</h2>
            <label className="text-sm font-bold text-slate-500" htmlFor="login-email">Email</label>
            <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="login-email" name="email" type="email" required />
            <label className="text-sm font-bold text-slate-500" htmlFor="login-password">Password</label>
            <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="login-password" name="password" type="password" minLength={6} required />
            <button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" type="submit">Login</button>
          </form>
          <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" action={signupAction}>
            <h2 className="text-xl font-extrabold text-slate-950">Create Account</h2>
            <label className="text-sm font-bold text-slate-500" htmlFor="name">Name</label>
            <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="name" name="name" />
            <label className="text-sm font-bold text-slate-500" htmlFor="signup-email">Email</label>
            <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="signup-email" name="email" type="email" required />
            <label className="text-sm font-bold text-slate-500" htmlFor="signup-password">Password</label>
            <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="signup-password" name="password" type="password" minLength={6} required />
            <button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" type="submit">Sign Up</button>
          </form>
        </div>
      </>
    );
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
          <button className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200" type="submit">Logout</button>
        </form>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-950">Cart</h2>
          <p className="mt-2 text-sm text-slate-500">{cart.count} item{cart.count === 1 ? "" : "s"} in cart</p>
          <strong>{formatter.format(cart.subtotal)}</strong>
          <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" href="/cart">Review Cart</Link>
        </section>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-950">Favorites</h2>
          {favorites.length === 0 ? <p className="mt-2 text-sm text-slate-500">No favorites saved.</p> : null}
          {favorites.slice(0, 4).map((product) => (
            <Link className="flex flex-col gap-1 border-t border-slate-200 pt-3 text-slate-950" href={`/products/${product.slug}`} key={product.id}>
              {product.name}
            </Link>
          ))}
        </section>

        <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-extrabold text-slate-950">Orders</h2>
          {orders.length === 0 ? <p className="mt-2 text-sm text-slate-500">No demo orders yet.</p> : null}
          {orders.map((order) => (
            <article className="flex flex-col gap-1 border-t border-slate-200 pt-3 text-slate-950" key={order.id}>
              <strong>Order #{order.id}</strong>
              <span>{formatter.format(order.subtotal)} · {order.status}</span>
              <small>{order.items.map((item) => `${item.quantity}x ${item.product_name}`).join(", ")}</small>
            </article>
          ))}
        </section>
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
