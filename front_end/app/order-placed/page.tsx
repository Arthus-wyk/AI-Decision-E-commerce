import Link from "next/link";
import { Suspense } from "react";

import { ConfettiCanvas } from "@/components/order/ConfettiCanvas";

type OrderPlacedPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function OrderPlacedPage({ searchParams }: OrderPlacedPageProps) {
  return (
    <main className="relative grid min-h-[calc(100vh-4rem)] place-items-center px-4 py-10 md:px-8">
      <ConfettiCanvas />
      <Suspense fallback={<OrderPlacedCard />}>
        <OrderPlacedContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function OrderPlacedContent({ searchParams }: OrderPlacedPageProps) {
  const orderId = valueOf((await searchParams).order);
  return <OrderPlacedCard orderId={orderId} />;
}

function OrderPlacedCard({ orderId }: { orderId?: string }) {
  return (
    <section className="relative z-10 w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9">
          <path
            fill="currentColor"
            d="M9.55 17.4 4.9 12.75l1.42-1.42 3.23 3.23 8.13-8.13 1.42 1.42-9.55 9.55Z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-950 md:text-4xl">Order placed</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Your demo order has been created successfully.
        {orderId ? <span className="mt-2 block font-bold text-slate-700">Order #{orderId}</span> : null}
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
          href="/products"
        >
          Continue Shopping
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-bold text-slate-950 transition hover:bg-slate-200"
          href="/account"
        >
          View Account
        </Link>
      </div>
    </section>
  );
}
