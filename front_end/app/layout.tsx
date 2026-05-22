import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShoppingCart } from "lucide-react";

import { getCart } from "@/actions/cart";
import { getCurrentUser } from "@/actions/user";
import { ShoppingAssistantSheet } from "@/components/AI/ShoppingAssistantSheet";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
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
        <ShoppingAssistantSheet floating />
        <Toaster />
        {children}
      </body>
    </html>
  );
}

async function SiteHeader() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  const itemCount = cart.items.length;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-blue-100 bg-white/95 px-4 shadow-sm backdrop-blur md:px-8">
      <Link className="text-lg font-extrabold text-blue-700 md:text-xl" href="/products">
        AI Decision Commerce
      </Link>
      <nav className="flex items-center gap-2 text-sm font-bold text-slate-500 md:gap-3" aria-label="Primary navigation">
        <Button asChild variant="ghost" size="sm">
          <Link href="/products">Products</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={user ? "/account" : "/signin"}>{user ? "Account" : "Login"}</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="relative">
          <Link href="/cart" aria-label={`Cart with ${itemCount} items`}>
            <ShoppingCart />
            Cart
            {itemCount > 0 ? (
              <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.5 text-[11px] leading-none text-white">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </Button>
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
        <span>Cart</span>
      </nav>
    </header>
  );
}
