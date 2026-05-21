import Link from "next/link";
import { Suspense } from "react";

import { getCart } from "@/actions/cart";
import { checkoutAction } from "@/actions/orders";
import { getCurrentUser } from "@/actions/user";

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function CheckoutPage() {
  return (
    <main className="w-full px-4 py-7 md:px-8 md:py-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">Demo Checkout</h1>
          <p className="mt-2 text-sm text-slate-500">No payment is collected. This creates a local demo order.</p>
        </div>
      </div>
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}

async function CheckoutContent() {
  const [cart, user] = await Promise.all([getCart(), getCurrentUser()]);

  return (
    <>
      {cart.items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          <strong className="mb-2 block text-slate-950">Your cart is empty.</strong>
          <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" href="/products">Browse products</Link>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" action={checkoutAction}>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-500" htmlFor="email">Email</label>
              <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="email" name="email" type="email" required defaultValue={user?.email ?? ""} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-500" htmlFor="full_name">Full name</label>
              <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="full_name" name="full_name" required defaultValue={user?.name ?? ""} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-500" htmlFor="address">Address</label>
              <textarea className="min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="address" name="address" required rows={4} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-500" htmlFor="city">City</label>
                <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="city" name="city" required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-slate-500" htmlFor="country">Country</label>
                <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="country" name="country" required defaultValue="Malaysia" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-500" htmlFor="phone">Phone</label>
              <input className="min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100" id="phone" name="phone" />
            </div>
            <button className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" type="submit">Create Demo Order</button>
          </form>

          <aside className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-950">Order Summary</h2>
            {cart.items.map((item) => (
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-3" key={item.product.id}>
                <span>{item.quantity} x {item.product.name}</span>
                <strong>{formatter.format(item.line_total)}</strong>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-3 text-lg">
              <span>Subtotal</span>
              <strong>{formatter.format(cart.subtotal)}</strong>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 animate-pulse rounded-full bg-slate-200" />
      </div>
      <aside className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 animate-pulse rounded-full bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
      </aside>
    </div>
  );
}
