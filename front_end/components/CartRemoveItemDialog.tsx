"use client";

import { ReactNode, useActionState, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { removeCartItemAction } from "@/actions/cart";
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { initialActionState } from "@/types/action-state";

type CartRemoveItemDialogProps = {
  productId: number;
  productName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
};

export function CartRemoveItemDialog({
  productId,
  productName,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: CartRemoveItemDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, formAction] = useActionState(removeCartItemAction, initialActionState);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    if (!state.message) {
      return;
    }
    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger !== null ? (
        <AlertDialogTrigger asChild>
          {trigger ?? (
            <Button className="text-red-700 hover:bg-red-50 hover:text-red-800" variant="ghost" type="button">
              <Trash2 />
              Remove
            </Button>
          )}
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this item?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove {productName} from your cart. You can add it again from the product catalog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancelButton type="button">Cancel</AlertDialogCancelButton>
          <form action={formAction} onSubmit={() => setOpen(false)}>
            <input type="hidden" name="product_id" value={productId} />
            <AlertDialogActionButton className="bg-red-600 hover:bg-red-700" type="submit">
              <Trash2 />
              Remove item
            </AlertDialogActionButton>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
