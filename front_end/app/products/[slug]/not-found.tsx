import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="w-full px-4 py-7 md:px-8 md:py-8">
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        <strong className="mb-2 block text-slate-950">Product not found.</strong>
        Return to the catalog to keep browsing.
        <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800" href="/products">Back to Products</Link>
      </div>
    </main>
  );
}
