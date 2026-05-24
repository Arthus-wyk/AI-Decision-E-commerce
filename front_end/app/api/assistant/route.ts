import {
  convertToModelMessages,
  createGateway,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiFetch, getAdminOrders, getAdminOverview, getAdminProducts, getAdminUsers, getProductById, getProductBySlug, getProducts } from "@/lib/api";
import type { Cart, User } from "@/types/commerce";
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
  is_active: z.boolean().optional(),
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
    is_active: product.is_active,
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
      assistantSessionId: z.string().optional(),
      userId: z.number().optional(),
      isSuperadmin: z.boolean().optional(),
      isAdminContext: z.boolean().optional(),
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
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const guestId = cookieStore.get("guest_id")?.value || parsed.data.assistantSessionId;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const currentUser = token
    ? await apiFetch<User | null>("/users/me", { headers: authHeaders, cache: "no-store" }).catch(() => null)
    : null;
  const isVerifiedSuperadmin = Boolean(currentUser?.is_superadmin);
  const userScope = currentUser ? `user:${currentUser.id}` : `guest:${parsed.data.assistantSessionId || "anonymous"}`;

  if (parsed.data.isAdminContext && !isVerifiedSuperadmin) {
    return Response.json({ error: "I can't access that information." }, { status: 403 });
  }

  const modelMessages = await convertToModelMessages(parsed.data.messages);
  const result = streamText({
    model: gateway(assistantModel),
    messages: modelMessages,
    stopWhen: stepCountIs(6),
    system: [
      "You are a shopping assistant for AI Decision Commerce.",
      "Use tools for catalog search, product details, and product comparisons before making product-specific claims.",
      "You can filter products by exact rating with rating, or by min_rating/max_rating ranges. If the user asks for 4.0 ratings only, use rating: 4.",
      "When the user asks for more results, call searchProducts with the next page instead of repeating earlier products.",
      "For shopping product suggestions, listings, comparisons, or exact product requests, call a product tool so the UI can render product cards. Keep text as a short intro and let the cards carry product details and CTAs.",
      "If the user asks for admin stats, revenue, counts, overview, product length, users count, or order totals, use adminOverview only. Do not call adminSearchProducts unless they explicitly ask to list or inspect products.",
      "Keep answers concise, practical, and grounded in product data returned by tools.",
      "If the user wants to buy or add an item, call draftAddToCart. If the user wants to add multiple products or everything in a list, call draftBulkAddToCart once. Ask for confirmation in the same message.",
      "If the user confirms a previous cart draft with yes/confirm/add them/do it, call confirmAddToCart or confirmBulkAddToCart using the exact product IDs and quantities from the previous draft.",
      "Do not say products are already in the cart unless getCart confirms those exact product IDs are present. If the user says to add again, draft the add action again even if a previous draft exists.",
      "A cart draft is not a completed add. Say drafted/prepared, not added, until the UI action succeeds.",
      "After confirmAddToCart or confirmBulkAddToCart succeeds, you may say the products were added.",
      `Assistant session scope: ${userScope}.`,
      isVerifiedSuperadmin
        ? "The user is a superadmin. You may use admin tools for products, orders, and users when asked."
        : "The user is not a superadmin. Do not answer admin-control, order-management, or user-management questions.",
      currentProduct
        ? `The user is currently viewing this product: ${JSON.stringify(currentProduct)}. Use getProductById for full details if needed.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
    tools: {
      getCart: tool({
        description: "Read the current cart contents before making claims about what is already in the cart.",
        inputSchema: z.object({
          guest_id: z.string().optional(),
        }),
        execute: async ({ guest_id }) => {
          const cart = await apiFetch<Cart>(
            "/cart",
            { headers: authHeaders, cache: "no-store" },
            token ? undefined : { guest_id: guest_id || parsed.data.assistantSessionId },
          ).catch(() => ({ items: [], subtotal: 0, count: 0 }));
          return {
            count: cart.count,
            subtotal: cart.subtotal,
            items: cart.items.map((item) => ({
              product_id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              quantity: item.quantity,
            })),
          };
        },
      }),
      searchProducts: tool({
        description: "Search catalog products by query, category, brand, price, stock, rating, and sort order.",
        inputSchema: z.object({
          q: z.string().optional().describe("Search text such as product type, feature, brand, or use case."),
          category: z.string().optional(),
          brand: z.string().optional(),
          min_price: z.number().nonnegative().optional(),
          max_price: z.number().nonnegative().optional(),
          rating: z.number().min(0).max(5).optional().describe("Exact product rating, e.g. 4.0 for only products rated 4.0."),
          min_rating: z.number().min(0).max(5).optional(),
          max_rating: z.number().min(0).max(5).optional(),
          in_stock: z.boolean().optional(),
          sort: z.enum(["newest", "price_asc", "price_desc", "rating_desc"]).optional(),
          page: z.number().int().min(1).optional(),
          page_size: z.number().int().min(1).max(24).optional(),
        }),
        execute: async (input) => {
          const params: ProductQueryParams = {
            ...input,
            page: input.page ?? 1,
            page_size: input.page_size ?? 6,
          };
          const result = await getProducts(params);
          return {
            type: "productResults" as const,
            total: result.total,
            page: result.page,
            page_size: result.page_size,
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
      draftBulkAddToCart: tool({
        description: "Create one bulk cart draft for explicit user confirmation. Use this when the user asks to add multiple products or all products from a list. This never mutates the cart.",
        inputSchema: z.object({
          items: z.array(z.object({
            product_id: z.number().int().positive(),
            quantity: z.number().int().min(1).max(99).default(1),
          })).min(1).max(24),
          rationale: z.string().min(1),
        }),
        execute: async ({ items, rationale }) => {
          const products = await Promise.all(items.map((item) => getProductById(String(item.product_id))));
          return {
            type: "bulkCartDraft" as const,
            products: products.map(summarizeProduct),
            draft: {
              items,
              rationale,
            },
            requires_confirmation: true,
          };
        },
      }),
      confirmAddToCart: tool({
        description: "After explicit user confirmation, add one previously drafted product to the cart.",
        inputSchema: z.object({
          product_id: z.number().int().positive(),
          quantity: z.number().int().min(1).max(99).default(1),
        }),
        execute: async ({ product_id, quantity }) => {
          const cart = await apiFetch<Cart>("/cart/items", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              product_id,
              quantity,
              guest_id: token ? undefined : guestId,
            }),
          });
          revalidatePath("/", "layout");
          revalidatePath("/cart");
          return {
            type: "cartMutation" as const,
            message: "Added to cart.",
            cart_count: cart.count,
            subtotal: cart.subtotal,
          };
        },
      }),
      confirmBulkAddToCart: tool({
        description: "After explicit user confirmation, add all products from a previous bulk cart draft to the cart.",
        inputSchema: z.object({
          items: z.array(z.object({
            product_id: z.number().int().positive(),
            quantity: z.number().int().min(1).max(99).default(1),
          })).min(1).max(24),
        }),
        execute: async ({ items }) => {
          const cart = await apiFetch<Cart>("/cart/items/bulk", {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              items,
              guest_id: token ? undefined : guestId,
            }),
          });
          revalidatePath("/", "layout");
          revalidatePath("/cart");
          return {
            type: "cartMutation" as const,
            message: `${items.length} item${items.length === 1 ? "" : "s"} added to cart.`,
            cart_count: cart.count,
            subtotal: cart.subtotal,
          };
        },
      }),
      draftProduct: tool({
        description: "Draft new product fields for a superadmin. This never saves anything; the UI asks the admin to save.",
        inputSchema: z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          short_description: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
          brand: z.string().optional(),
          price: z.number().min(0),
          stock_quantity: z.number().int().min(0),
          image_url: z.string().optional(),
          rating: z.number().min(0).max(5).optional(),
          is_active: z.boolean().default(true),
          rationale: z.string().optional(),
        }),
        execute: async (input) => {
          if (!isVerifiedSuperadmin) {
            return { type: "forbidden", message: "I can't access that information." };
          }
          return { type: "productDraft" as const, draft: input, requires_confirmation: true };
        },
      }),
      adminOverview: tool({
        description: "Superadmin-only overview stats: revenue, product counts, user counts, order counts.",
        inputSchema: z.object({}),
        execute: async () => {
          if (!isVerifiedSuperadmin) {
            return { type: "forbidden", message: "I can't access that information." };
          }
          return getAdminOverview(authHeaders);
        },
      }),
      adminSearchProducts: tool({
        description: "Superadmin-only product search including inactive products.",
        inputSchema: z.object({
          q: z.string().optional(),
          active: z.boolean().optional(),
          sort: z.enum(["newest", "name_asc", "price_asc", "price_desc", "stock_asc", "stock_desc"]).optional(),
          page: z.number().int().min(1).optional(),
          page_size: z.number().int().min(1).max(24).optional(),
        }),
        execute: async (input) => {
          if (!isVerifiedSuperadmin) {
            return { type: "forbidden", message: "I can't access that information." };
          }
          const result = await getAdminProducts(authHeaders, { ...input, page: input.page ?? 1, page_size: input.page_size ?? 10 });
          return { type: "productResults" as const, total: result.total, page: result.page, page_size: result.page_size, products: result.items.map(summarizeProduct) };
        },
      }),
      adminSearchOrders: tool({
        description: "Superadmin-only order search by customer/status/city/country.",
        inputSchema: z.object({
          q: z.string().optional(),
          status: z.enum(["all", "created", "processing", "shipped", "cancelled"]).optional(),
          sort: z.enum(["newest", "oldest", "subtotal_asc", "subtotal_desc"]).optional(),
          page: z.number().int().min(1).optional(),
          page_size: z.number().int().min(1).max(24).optional(),
        }),
        execute: async (input) => {
          if (!isVerifiedSuperadmin) {
            return { type: "forbidden", message: "I can't access that information." };
          }
          return getAdminOrders(authHeaders, { ...input, page: input.page ?? 1, page_size: input.page_size ?? 10 });
        },
      }),
      adminSearchUsers: tool({
        description: "Superadmin-only user search by name/email/role/status.",
        inputSchema: z.object({
          q: z.string().optional(),
          active: z.boolean().optional(),
          role: z.enum(["all", "superadmin", "customer"]).optional(),
          sort: z.enum(["newest", "email_asc", "email_desc"]).optional(),
          page: z.number().int().min(1).optional(),
          page_size: z.number().int().min(1).max(24).optional(),
        }),
        execute: async (input) => {
          if (!isVerifiedSuperadmin) {
            return { type: "forbidden", message: "I can't access that information." };
          }
          return getAdminUsers(authHeaders, { ...input, page: input.page ?? 1, page_size: input.page_size ?? 10 });
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
