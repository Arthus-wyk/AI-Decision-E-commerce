"use client";

import { FormEvent, useState, useTransition } from "react";

import { askShopAssistantAction } from "@/actions/assistant";
import { addToCartAction } from "@/actions/cart";
import type { CartDraft, ShopAssistantResponse } from "@/types/commerce";
import type { Product } from "@/types/product";

type ShoppingAssistantSheetProps = {
  product?: Product;
};

export function ShoppingAssistantSheet({ product }: ShoppingAssistantSheetProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(product ? `Is ${product.name} a good choice?` : "");
  const [response, setResponse] = useState<ShopAssistantResponse | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        setResponse(await askShopAssistantAction(message, product?.id));
      } catch (requestError) {
        setError((requestError as Error).message);
      }
    });
  }

  return (
    <>
      <button className="secondary-button" type="button" onClick={() => setOpen(true)}>
        Ask AI Assistant
      </button>
      {open ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <aside
            className="sheet-panel"
            aria-label="AI shopping assistant"
            aria-modal="true"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <h2>Shopping Assistant</h2>
                <p>Ask about catalog fit, stock, or cart options.</p>
              </div>
              <button className="icon-button" type="button" aria-label="Close assistant" onClick={() => setOpen(false)}>
                x
              </button>
            </div>
            <form className="assistant-form" onSubmit={submit}>
              <label htmlFor="assistant-message">Message</label>
              <textarea
                id="assistant-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
              />
              <button className="primary-button" type="submit" disabled={pending || !message.trim()}>
                {pending ? "Thinking..." : "Ask"}
              </button>
            </form>
            {error ? <p className="form-error">{error}</p> : null}
            {response ? (
              <div className="assistant-response">
                <p>{response.message}</p>
                {response.cart_draft ? <CartDraftConfirm draft={response.cart_draft} /> : null}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function CartDraftConfirm({ draft }: { draft: CartDraft }) {
  return (
    <form className="draft-box" action={addToCartAction}>
      <input type="hidden" name="product_id" value={draft.product_id} />
      <input type="hidden" name="quantity" value={draft.quantity} />
      <p>{draft.rationale}</p>
      <button className="primary-button" type="submit">
        Confirm Add to Cart
      </button>
    </form>
  );
}
