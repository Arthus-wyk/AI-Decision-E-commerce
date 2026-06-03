"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ActionNoticeProps = {
  message: string;
  type?: string;
  timeoutMs?: number;
};

export function ActionNotice({ message, type, timeoutMs = 3500 }: ActionNoticeProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("notice");
      nextParams.delete("notice_type");
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, timeoutMs);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, timeoutMs]);

  return (
    <div
      className={
        type === "error"
          ? "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          : "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
      }
    >
      {message}
    </div>
  );
}
