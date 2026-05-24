"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/types/action-state";

const statuses = [
  { label: "Created", value: "created" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Cancelled", value: "cancelled" },
] as const;

export function OrderStatusForm({ orderId, status }: { orderId: number; status: string }) {
  const [selected, setSelected] = useState(status);
  const [state, formAction, pending] = useActionState(updateOrderStatusAction, initialActionState);
  const router = useRouter();

  useEffect(() => {
    window.setTimeout(() => setSelected(status), 0);
  }, [status]);

  useEffect(() => {
    if (!state.message) {
      return;
    }
    if (state.ok) {
      toast.success("Order updated", { description: state.message });
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [router, state]);

  return (
    <form action={formAction} className="flex min-w-56 gap-2">
      <input type="hidden" name="id" value={orderId} />
      <select
        name="status"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="h-9 flex-1 rounded-md border border-blue-200 bg-white px-2 text-sm"
      >
        {statuses.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
