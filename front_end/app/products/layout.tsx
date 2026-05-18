import Link from "next/link";
import type { ReactNode } from "react";


export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="site-header">
        <Link className="brand-link" href="/products">
          AI Shop
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/products">Products</Link>
          <Link href="/compare/groups">Compare</Link>
        </nav>
      </header>
      {children}
    </>
  );
}
