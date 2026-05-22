import Link from "next/link";
import { Suspense } from "react";

import { getCart } from "@/actions/cart";
import { checkoutAction } from "@/actions/orders";
import { getCurrentUser } from "@/actions/user";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
          <Button asChild className="mt-4">
            <Link href="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <CheckoutForm action={checkoutAction} defaults={{ email: user?.email ?? "", full_name: user?.name ?? "" }} />

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
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
            </CardContent>
          </Card>
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
