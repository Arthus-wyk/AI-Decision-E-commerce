import {
  convertToModelMessages,
  createGateway,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { getProductById, getProductBySlug, getProducts } from "@/lib/api";
import type { Product, ProductQueryParams } from "@/types/product";

export const maxDuration = 30;

const assistantModel = process.env.AI_GATEWAY_MODEL || "openai/gpt-5.2";
const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

const productSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  price: z.number(),
  stock_quantity: z.number(),
  rating: z.number().optional(),
  image_url: z.string().optional(),
});

const currentProductSchema = productSummarySchema.partial().extend({
  id: z.number(),
  name: z.string(),
  slug: z.string().optional(),
});

function summarizeProduct(product: Product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.short_description || product.description,
    category: product.category,
    brand: product.brand,
    price: product.price,
    stock_quantity: product.stock_quantity,
    rating: product.rating,
    image_url: product.image_url,
  };
}

function comparisonRows(products: Product[]) {
  return products.map((product) => ({
    ...summarizeProduct(product),
    availability: product.stock_quantity > 0 ? "in stock" : "out of stock",
  }));
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = z
    .object({
      messages: z.array(z.custom<UIMessage>()),
      currentProduct: currentProductSchema.optional(),
    })
    .safeParse(payload);

  if (!parsed.success) {
    return Response.json({ error: "Invalid assistant request." }, { status: 400 });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      { error: "AI_GATEWAY_API_KEY is required to use the shopping assistant." },
      { status: 500 },
    );
  }

  const currentProduct = parsed.data.currentProduct;
  const modelMessages = await convertToModelMessages(parsed.data.messages);
  const result = streamText({
    model: gateway(assistantModel),
    messages: modelMessages,
    stopWhen: stepCountIs(6),
    system: [
      "You are a shopping assistant for AI Decision Commerce.",
      "Use tools for catalog search, product details, and product comparisons before making product-specific claims.",
      "Keep answers concise, practical, and grounded in product data returned by tools.",
      "If the user wants to buy or add an item, call draftAddToCart. Never claim the cart was mutated.",
      "The UI will ask the user to explicitly confirm any cart draft.",
      currentProduct
        ? `The user is currently viewing this product: ${JSON.stringify(currentProduct)}. Use getProductById for full details if needed.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    tools: {
      searchProducts: tool({
        description: "Search catalog products by query, category, brand, price, stock, and sort order.",
        inputSchema: z.object({
          q: z.string().optional().describe("Search text such as product type, feature, brand, or use case."),
          category: z.string().optional(),
          brand: z.string().optional(),
          min_price: z.number().nonnegative().optional(),
          max_price: z.number().nonnegative().optional(),
          in_stock: z.boolean().optional(),
          sort: z.enum(["newest", "price_asc", "price_desc", "rating_desc"]).optional(),
          page_size: z.number().int().min(1).max(12).optional(),
        }),
        execute: async (input) => {
          const params: ProductQueryParams = {
            ...input,
            page: 1,
            page_size: input.page_size ?? 6,
          };
          const result = await getProducts(params);
          return {
            total: result.total,
            products: result.items.map(summarizeProduct),
          };
        },
      }),
      getProductById: tool({
        description: "Fetch exact product details by numeric product ID.",
        inputSchema: z.object({
          id: z.number().int().positive(),
        }),
        execute: async ({ id }) => summarizeProduct(await getProductById(String(id))),
      }),
      getProductBySlug: tool({
        description: "Fetch exact product details by product slug.",
        inputSchema: z.object({
          slug: z.string().min(1),
        }),
        execute: async ({ slug }) => summarizeProduct(await getProductBySlug(slug)),
      }),
      compareProducts: tool({
        description: "Load products server-side and return structured comparison context for the model.",
        inputSchema: z.object({
          product_ids: z.array(z.number().int().positive()).min(2).max(6),
          criteria: z.string().optional().describe("User decision criteria, such as budget, use case, or priorities."),
        }),
        execute: async ({ product_ids, criteria }) => {
          const products = await Promise.all(product_ids.map((id) => getProductById(String(id))));
          return {
            criteria: criteria || "overall fit, price, rating, stock, and product description",
            products: comparisonRows(products),
          };
        },
      }),
      draftAddToCart: tool({
        description: "Create a cart draft for explicit user confirmation. This never mutates the cart.",
        inputSchema: z.object({
          product_id: z.number().int().positive(),
          quantity: z.number().int().min(1).max(99).default(1),
          rationale: z.string().min(1),
        }),
        execute: async ({ product_id, quantity, rationale }) => {
          const product = await getProductById(String(product_id));
          return {
            type: "cartDraft" as const,
            product: summarizeProduct(product),
            draft: {
              product_id,
              quantity,
              rationale,
            },
            requires_confirmation: true,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
