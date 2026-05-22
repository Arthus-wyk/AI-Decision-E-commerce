import Link from "next/link";
import { Suspense } from "react";

import { getCart } from "@/actions/cart";
import { CartClearDialog } from "@/components/CartClearDialog";
import { CartQuantityForm } from "@/components/CartQuantityForm";
import { CartRemoveItemDialog } from "@/components/CartRemoveItemDialog";
import { Button } from "@/components/ui/button";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

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
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">
            Cart
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {cart.count} item{cart.count === 1 ? "" : "s"} ready for demo
            checkout.
          </p>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          <strong className="mb-2 block text-slate-950">
            Your cart is empty.
          </strong>
          <Button asChild className="mt-4">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="grid gap-3" aria-label="Cart items">
            {cart.items.map((item) => (
              <article
                className="grid items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[112px_minmax(0,1fr)_140px_auto]"
                key={item.product.id}
              >
                <img
                  className="aspect-4/3 w-28 rounded-lg object-cover max-md:w-full"
                  src={
                    item.product.image_url ||
                    "https://placehold.co/160x120?text=Product"
                  }
                  alt={item.product.name}
                />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">
                    {item.product.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.product.brand} {item.product.category}
                  </p>
                  <strong className="mt-2 block text-slate-950">
                    {formatter.format(item.product.price)}
                  </strong>
                </div>
                <CartQuantityForm
                  productId={item.product.id}
                  productName={item.product.name}
                  quantity={item.quantity}
                  max={Math.max(item.product.stock_quantity, item.quantity)}
                />
                <CartRemoveItemDialog
                  productId={item.product.id}
                  productName={item.product.name}
                />
              </article>
            ))}
          </section>

          <aside className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-950">Summary</h2>
            <div className="flex justify-between gap-3 border-t border-slate-200 pt-3">
              <span>Subtotal</span>
              <strong>{formatter.format(cart.subtotal)}</strong>
            </div>
            <Button asChild className="w-full">
              <Link href="/checkout">Checkout</Link>
            </Button>
            <CartClearDialog />
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
          <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">
            Cart
          </h1>
          <p className="mt-2 text-sm text-slate-500">Loading cart items...</p>
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-3" aria-label="Loading cart items">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="grid items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[112px_minmax(0,1fr)_140px_auto]"
              key={index}
            >
              <div className="aspect-4/3 w-28 animate-pulse rounded-lg bg-slate-200" />
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
