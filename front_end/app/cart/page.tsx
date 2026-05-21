import Link from "next/link";
import { Suspense } from "react";

import { clearCartAction, getCart, removeCartItemAction, updateCartItemAction } from "@/actions/cart";

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function CartPage() {
  return (
    <main className="w-full px-4 py-7 md:px-8 md:py-8">
      <Suspense fallback={<CartSkeleton />}>
        <CartContent />
      </Suspense>
    </main>
  );
}

async function CartContent() {
  const cart = await getCart();

  return (
    <>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">Cart</h1>
          <p className="mt-2 text-sm text-slate-500">{cart.count} item{cart.count === 1 ? "" : "s"} ready for demo checkout.</p>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          <strong className="mb-2 block text-slate-950">Your cart is empty.</strong>
          <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" href="/products">Browse products</Link>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-3" aria-label="Cart items">
            {cart.items.map((item) => (
              <article className="grid items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[112px_minmax(0,1fr)_140px_auto]" key={item.product.id}>
                <img className="aspect-[4/3] w-28 rounded-lg object-cover max-md:w-full" src={item.product.image_url || "https://placehold.co/160x120?text=Product"} alt={item.product.name} />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">{item.product.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.product.brand} {item.product.category}</p>
                  <strong className="mt-2 block text-slate-950">{formatter.format(item.product.price)}</strong>
                </div>
                <form action={updateCartItemAction} className="grid gap-2">
                  <input type="hidden" name="product_id" value={item.product.id} />
                  <label className="text-sm font-bold text-slate-500" htmlFor={`quantity-${item.product.id}`}>Qty</label>
                  <input
                    className="min-h-10 rounded-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    id={`quantity-${item.product.id}`}
                    name="quantity"
                    type="number"
                    min="0"
                    max={Math.max(item.product.stock_quantity, item.quantity)}
                    defaultValue={item.quantity}
                  />
                  <button className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-950 hover:bg-slate-200" type="submit">Update</button>
                </form>
                <form action={removeCartItemAction}>
                  <input type="hidden" name="product_id" value={item.product.id} />
                  <button className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-bold text-blue-700 hover:bg-blue-50" type="submit">Remove</button>
                </form>
              </article>
            ))}
          </section>

          <aside className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-950">Summary</h2>
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
              <span>Subtotal</span>
              <strong>{formatter.format(cart.subtotal)}</strong>
            </div>
            <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" href="/checkout">Checkout</Link>
            <form action={clearCartAction}>
              <button className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200" type="submit">Clear Cart</button>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

function CartSkeleton() {
  return (
    <>
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">Cart</h1>
          <p className="mt-2 text-sm text-slate-500">Loading cart items...</p>
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-3" aria-label="Loading cart items">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="grid items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[112px_minmax(0,1fr)_140px_auto]" key={index}>
              <div className="aspect-[4/3] w-28 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
            </div>
          ))}
        </section>
        <aside className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-5 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
        </aside>
      </div>
    </>
  );
}
