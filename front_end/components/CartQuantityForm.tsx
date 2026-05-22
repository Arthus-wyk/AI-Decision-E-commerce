"use client";

import { FormEvent, useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { updateCartItemAction } from "@/actions/cart";
import { CartRemoveItemDialog } from "@/components/CartRemoveItemDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialActionState } from "@/types/action-state";

type CartQuantityFormProps = {
  productId: number;
  productName: string;
  quantity: number;
  max: number;
};

export function CartQuantityForm({ productId, productName, quantity, max }: CartQuantityFormProps) {
  const [state, formAction] = useActionState(updateCartItemAction, initialActionState);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!state.message) {
      return;
    }
    if (state.ok) {
      toast.success(state.message, {
        action: state.href
          ? {
              label: state.hrefLabel ?? "View cart",
              onClick: () => {
                window.location.href = state.href ?? "/cart";
              },
            }
          : undefined,
      });
    } else {
      toast.error(state.message);
    }
  }, [state]);

  function submit(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const nextQuantity = Number(formData.get("quantity") ?? quantity);
    if (nextQuantity === 0) {
      event.preventDefault();
      setConfirmOpen(true);
    }
  }

  return (
    <>
      <form action={formAction} className="grid gap-2" onSubmit={submit} ref={formRef}>
        <input type="hidden" name="product_id" value={productId} />
        <Label htmlFor={`quantity-${productId}`}>Qty</Label>
        <Input
          id={`quantity-${productId}`}
          name="quantity"
          type="number"
          min="0"
          max={max}
          defaultValue={quantity}
        />
        <Button variant="outline" size="sm" type="submit">
          Update
        </Button>
      </form>
      <CartRemoveItemDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        productId={productId}
        productName={productName}
        trigger={null}
      />
    </>
  );
}
