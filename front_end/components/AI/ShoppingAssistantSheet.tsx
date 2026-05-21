"use client";

import { useMemo, useRef, useState, useEffect, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { addToCartAction } from "@/actions/cart";
import type { CartDraft } from "@/types/commerce";
import type { Product } from "@/types/product";

type ShoppingAssistantSheetProps = {
  product?: Product;
};

type CartDraftOutput = {
  type: "cartDraft";
  product?: Pick<Product, "id" | "name" | "price" | "stock_quantity">;
  draft: CartDraft;
  requires_confirmation: true;
};

function isCartDraftOutput(output: unknown): output is CartDraftOutput {
  return (
    typeof output === "object" &&
    output !== null &&
    (output as { type?: string }).type === "cartDraft" &&
    typeof (output as { draft?: unknown }).draft === "object"
  );
}

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function ShoppingAssistantSheet({ product }: ShoppingAssistantSheetProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(product ? `Is ${product.name} a good choice?` : "");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
        body: {
          currentProduct: product
            ? {
                id: product.id,
                name: product.name,
                slug: product.slug,
                category: product.category,
                brand: product.brand,
                price: product.price,
                stock_quantity: product.stock_quantity,
                rating: product.rating,
              }
            : undefined,
        },
      }),
    [product],
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) {
      return;
    }
    setInput("");
    await sendMessage({ text });
  }

  return (
    <>
      <button className="secondary-button" type="button" onClick={() => setOpen(true)}>
        Ask AI Assistant
      </button>
      {open ? (
        <div className="sheet-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <aside
            className="sheet-panel assistant-chat-sheet"
            aria-label="AI shopping assistant"
            aria-modal="true"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sheet-header">
              <div>
                <h2>Shopping Assistant</h2>
                <p>Ask for discovery, comparisons, or a cart draft.</p>
              </div>
              <button className="icon-button" type="button" aria-label="Close assistant" onClick={() => setOpen(false)}>
                x
              </button>
            </div>

            <div className="assistant-thread" aria-live="polite">
              {messages.length === 0 ? (
                <div className="assistant-empty">
                  <p>
                    {product
                      ? `Ask about ${product.name}, compare it with alternatives, or draft a cart add.`
                      : "Ask about products, compare options, or draft a cart add."}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <article className={`assistant-message ${message.role}`} key={message.id}>
                    <span className="assistant-message-role">{message.role === "user" ? "You" : "Assistant"}</span>
                    {messageText(message) ? <p>{messageText(message)}</p> : null}
                    {message.parts.map((part, index) => (
                      <ToolPart part={part} key={`${message.id}-${part.type}-${index}`} />
                    ))}
                  </article>
                ))
              )}
              {busy ? <p className="assistant-status">Thinking...</p> : null}
              <div ref={bottomRef} />
            </div>

            {error ? <p className="form-error">{error.message}</p> : null}

            <form className="assistant-chat-form" onSubmit={submit}>
              <label htmlFor="assistant-message">Message</label>
              <textarea
                id="assistant-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder="Compare headphones, find a fitness product, or draft an add to cart..."
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <div className="assistant-chat-actions">
                {busy ? (
                  <button className="secondary-button compact" type="button" onClick={stop}>
                    Stop
                  </button>
                ) : null}
                <button className="primary-button compact" type="submit" disabled={busy || !input.trim()}>
                  Send
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function ToolPart({ part }: { part: UIMessage["parts"][number] }) {
  if (!part.type.startsWith("tool-")) {
    return null;
  }

  const toolPart = part as {
    state?: string;
    errorText?: string;
    output?: unknown;
  };

  if (toolPart.state === "input-streaming" || toolPart.state === "input-available") {
    return <p className="assistant-tool-note">Checking catalog data...</p>;
  }

  if (toolPart.state === "output-error") {
    return <p className="form-error">{toolPart.errorText}</p>;
  }

  if (toolPart.state !== "output-available") {
    return null;
  }

  if (isCartDraftOutput(toolPart.output)) {
    return <CartDraftConfirm output={toolPart.output} />;
  }

  return null;
}

function CartDraftConfirm({ output }: { output: CartDraftOutput }) {
  return (
    <form className="draft-box" action={addToCartAction}>
      <input type="hidden" name="product_id" value={output.draft.product_id} />
      <input type="hidden" name="quantity" value={output.draft.quantity} />
      {output.product ? (
        <strong>
          {output.product.name} - ${output.product.price.toFixed(2)}
        </strong>
      ) : null}
      <p>{output.draft.rationale}</p>
      <button className="primary-button compact" type="submit">
        Confirm Add to Cart
      </button>
    </form>
  );
}
