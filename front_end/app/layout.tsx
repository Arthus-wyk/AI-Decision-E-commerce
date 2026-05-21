import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { getCart } from "@/actions/cart";
import { getCurrentUser } from "@/actions/user";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Decision Commerce",
  description: "E-commerce catalog with cart, account, and AI shopping support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <Suspense fallback={<HeaderSkeleton />}>
          <SiteHeader />
        </Suspense>
        <Suspense fallback={null}>
          <FloatingCartButton />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur md:px-8">
      <Link className="text-lg font-extrabold text-blue-700 md:text-xl" href="/products">
        AI Decision Commerce
      </Link>
      <nav className="flex items-center gap-4 text-sm font-bold text-slate-500 md:gap-6" aria-label="Primary navigation">
        <Link className="transition hover:text-slate-950" href="/products">Products</Link>
        <Link className="transition hover:text-slate-950" href="/account">{user ? "Account" : "Login"}</Link>
      </nav>
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur md:px-8">
      <Link className="text-lg font-extrabold text-blue-700 md:text-xl" href="/products">
        AI Decision Commerce
      </Link>
      <nav className="flex items-center gap-4 text-sm font-bold text-slate-500 md:gap-6" aria-label="Primary navigation">
        <span>Products</span>
        <span>Account</span>
      </nav>
    </header>
  );
}

async function FloatingCartButton() {
  const cart = await getCart();
  const itemCount = cart.items.length;

  return (
    <Link
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-blue-700 text-white shadow-xl shadow-blue-700/25 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 max-sm:bottom-4 max-sm:right-4 max-sm:h-13 max-sm:w-13"
      href="/cart"
      aria-label={`Cart with ${itemCount} items`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
        <path
          d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 18ZM4.2 4l1.7 9.2A3 3 0 0 0 8.85 15h7.7a3 3 0 0 0 2.86-2.1l1.46-4.64A1 1 0 0 0 19.92 7H7.1L6.68 4.7A2 2 0 0 0 4.72 3H3a1 1 0 1 0 0 2h1.2Zm3.28 5h11.08l-1.05 3.3a1 1 0 0 1-.95.7H8.85a1 1 0 0 1-.98-.82L7.48 9Z"
          fill="currentColor"
        />
      </svg>
      <span className="absolute -right-1.5 -top-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-slate-950 px-1.5 text-xs font-extrabold leading-none text-white">
        {itemCount}
      </span>
    </Link>
  );
}
