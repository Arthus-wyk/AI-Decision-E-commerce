"use client";

import { useActionState, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { Bot, Loader2, Send, ShoppingCart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";

import { addToCartAction } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { initialActionState } from "@/types/action-state";
import type { CartDraft } from "@/types/commerce";
import type { Product } from "@/types/product";

type ShoppingAssistantSheetProps = {
  product?: Product;
  floating?: boolean;
};

type CartDraftOutput = {
  type: "cartDraft";
  product?: Pick<Product, "id" | "name" | "price" | "stock_quantity" | "slug">;
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

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code className="rounded bg-slate-200 px-1 py-0.5 text-[0.9em]" key={`${match.index}-code`}>
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        parts.push(
          <a
            className="font-semibold text-blue-700 underline underline-offset-2"
            href={linkMatch[2]}
            key={`${match.index}-link`}
            rel="noreferrer"
            target={linkMatch[2].startsWith("/") ? undefined : "_blank"}
          >
            {linkMatch[1]}
          </a>,
        );
      }
    } else if (token.startsWith("*")) {
      parts.push(<em key={`${match.index}-em`}>{token.slice(1, -1)}</em>);
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function MarkdownMessage({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="grid gap-3">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const unordered = lines.every((line) => /^[-*]\s+/.test(line));
        const ordered = lines.every((line) => /^\d+[.)]\s+/.test(line));

        if (unordered || ordered) {
          const ListTag = unordered ? "ul" : "ol";
          return (
            <ListTag
              className={cn(
                "grid gap-1 pl-5",
                unordered ? "list-disc" : "list-decimal",
              )}
              key={blockIndex}
            >
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInlineMarkdown(line.replace(/^([-*]|\d+[.)])\s+/, ""))}</li>
              ))}
            </ListTag>
          );
        }

        return (
          <p className="whitespace-pre-wrap" key={blockIndex}>
            {renderInlineMarkdown(block)}
          </p>
        );
      })}
    </div>
  );
}

export function ShoppingAssistantSheet({ product, floating = false }: ShoppingAssistantSheetProps) {
  const [input, setInput] = useState(product ? `Compare ${product.name} with a similar product.` : "");
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
    <Sheet>
      <SheetTrigger asChild>
        {floating ? (
          <Button
            className="fixed bottom-6 right-6 z-50 h-14 rounded-full px-5 shadow-xl shadow-blue-700/25 max-sm:bottom-4 max-sm:right-4"
            aria-label="Open AI shopping assistant"
          >
            <Sparkles className="h-5 w-5" />
            <span className="hidden sm:inline">AI Shop</span>
          </Button>
        ) : (
          <Button type="button" variant="secondary">
            <Bot />
            Ask AI Assistant
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="max-w-[94vw] bg-white p-0 sm:max-w-[520px]">
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <SheetHeader className="pr-10">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <SheetTitle className="text-base">Shopping Assistant</SheetTitle>
                  <SheetDescription className="mt-0.5">Ask, compare, and draft cart actions.</SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Try asking</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  "Compare Wireless Headphones Pro and Gaming Headset",
                  "Which laptop accessory is best under $80?",
                  "Find a good fitness product and explain why",
                ].map((prompt) => (
                  <Button
                    className="shrink-0 rounded-full"
                    key={prompt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
              {messages.length === 0 ? (
                <div className="grid h-full min-h-80 place-items-center text-center">
                  <div className="max-w-sm">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {product ? `Ask about ${product.name}` : "How can I help you shop?"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      I can search products, compare options, and prepare cart drafts for you to confirm.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-5">
                  {messages.map((message) => (
                    <div
                      className={cn(
                        "flex max-w-[92%] gap-3",
                        message.role === "user" ? "justify-self-end" : "justify-self-start",
                      )}
                      key={message.id}
                    >
                      {message.role === "assistant" ? (
                        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                          <Bot className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                      <div
                        className={cn(
                          "grid gap-2 rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                          message.role === "user"
                            ? "rounded-br-sm bg-blue-600 text-white"
                            : "rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-900",
                        )}
                      >
                        {messageText(message) ? <MarkdownMessage text={messageText(message)} /> : null}
                        {message.parts.map((part, index) => (
                          <ToolPart part={part} key={`${message.id}-${part.type}-${index}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                  {busy ? (
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white">
                        <Bot className="h-3.5 w-3.5" />
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </span>
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {error ? <p className="px-4 pb-2 text-sm font-semibold text-red-600">{error.message}</p> : null}

            <form className="border-t border-slate-200 bg-white p-4" onSubmit={submit}>
              <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
                <Textarea
                  className="min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={2}
                  placeholder="Message the assistant..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <div className="flex gap-2">
                  {busy ? (
                    <Button className="rounded-full" variant="outline" size="icon" type="button" onClick={stop} aria-label="Stop response">
                      <Loader2 className="animate-spin" />
                    </Button>
                  ) : null}
                  <Button className="rounded-full" size="icon" type="submit" disabled={busy || !input.trim()} aria-label="Send message">
                    <Send />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-blue-700">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking catalog data...
      </p>
    );
  }

  if (toolPart.state === "output-error") {
    return <p className="text-sm font-semibold text-red-600">{toolPart.errorText}</p>;
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
  const [state, formAction] = useActionState(addToCartAction, initialActionState);

  useEffect(() => {
    if (!state.message) {
      return;
    }
    if (state.ok) {
      toast.success("Added successfully.", {
        description: state.message,
        action: {
          label: "Go to cart",
          onClick: () => {
            window.location.href = "/cart";
          },
        },
      });
    } else {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-slate-950" action={formAction}>
      <input type="hidden" name="product_id" value={output.draft.product_id} />
      <Input type="hidden" name="quantity" value={output.draft.quantity} readOnly />
      <div className="flex items-start justify-between gap-3">
        <div>
          {output.product ? (
            <strong>
              {output.product.name} - ${output.product.price.toFixed(2)}
            </strong>
          ) : null}
          <p className="mt-1 text-sm text-slate-500">{output.draft.rationale}</p>
        </div>
        {output.product?.slug ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/products/${output.product.slug}`}>View</Link>
          </Button>
        ) : null}
      </div>
      {state.ok ? (
        <Button asChild size="sm">
          <Link href="/cart">
            <ShoppingCart />
            Added successfully - Go to cart
          </Link>
        </Button>
      ) : (
        <Button type="submit" size="sm">
          <ShoppingCart />
          Add to cart
        </Button>
      )}
    </form>
  );
}
