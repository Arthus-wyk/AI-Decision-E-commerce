"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
};

export function PaginationControls({ page, totalPages }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  function go(nextPage: number) {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(nextPage));
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        Previous
      </button>
      <span className="text-sm font-bold text-slate-500">
        Page {page} of {totalPages}
      </span>
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        disabled={page >= totalPages}
        onClick={() => go(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
