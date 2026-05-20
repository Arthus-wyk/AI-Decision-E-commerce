import type {Product, ProductListResponse, ProductQueryParams} from "@/types/product";
import axios from "axios";
import type {SessionData, GroupParams} from "@/types/compare";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE ?? "/api";

function getApiBaseUrl(): string {
    return API_BASE_URL.replace(/\/$/, "");
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
    const apiBaseUrl = getApiBaseUrl();
    const url = new URL(`${apiBaseUrl}${path}`, window.location.origin);

    Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
            return;
        }
        url.searchParams.set(key, String(value));
    });

    return apiBaseUrl.startsWith("http") ? url.toString() : `${url.pathname}${url.search}`;
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(buildUrl(path), {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const detail = (payload as { detail?: string }).detail;
        throw new Error(detail || `Request failed with status ${response.status}`);
    }

    return payload as T;
}

export function getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
    return fetchJson<ProductListResponse>(buildUrl("/products", params));
}

export function getProductBySlug(slug: string): Promise<Product> {
    return fetchJson<Product>(buildUrl(`/products/${encodeURIComponent(slug)}`));
}

export function getProductById(id: string): Promise<Product> {
    return fetchJson<Product>(buildUrl(`/products/byId/${encodeURIComponent(id)}`));
}

export function getCategories(): Promise<string[]> {
    return fetchJson<string[]>(buildUrl("/products/meta/categories"));
}

export function getBrands(): Promise<string[]> {
    return fetchJson<string[]>(buildUrl("/products/meta/brands"));
}

export type SessionListResponse = {
    user_id: string
    sessions: SessionData[];
};

export type HydratedSessionProduct = Product & {
    product_id?: string;
};

export type HydratedCompareSession = Omit<SessionData, "products"> & {
    products: HydratedSessionProduct[];
};

function normalizeProductId(product: unknown): string {
    if (typeof product === "string" || typeof product === "number") {
        return String(product);
    }

    if (product && typeof product === "object") {
        const record = product as Record<string, unknown>;
        const candidate =
            record.id ??
            record.product_id ??
            record.productId ??
            record.slug ??
            record.value;

        if (candidate !== undefined && candidate !== null) {
            return String(candidate);
        }
    }

    return "";
}

export async function getSessions(params: GroupParams): Promise<SessionListResponse> {
    const response = await axios.get(buildUrl("/sessions"), {
        headers: {
            "Content-Type": "application/json",
        },
        params,
    });

    return response.data as SessionListResponse;
}

export async function hydrateCompareSession(session: SessionData): Promise<HydratedCompareSession> {
    const hydratedProducts = await Promise.all(
        (session.products || [])
            .map((product) => normalizeProductId(product))
            .filter(Boolean)
            .map(async (productId) => {
                try {
                    const product = await getProductById(productId);
                    return {
                        ...product,
                        product_id: productId,
                    };
                } catch {
                    return null;
                }
            }),
    );

    const products = hydratedProducts.filter(Boolean) as HydratedSessionProduct[];

    return {
        ...session,
        products,
    };
}

export async function getHydratedCompareSessions(params: GroupParams): Promise<HydratedCompareSession[]> {
    const payload = await getSessions(params);

    return Promise.all((payload.sessions || []).map((session) => hydrateCompareSession(session)));
}

export type CreateCompareSessionResponse = {
    message?: string;
    session_id: string;
    session?: SessionData;
    data?: SessionData;
};

export async function createCompareSession(input: {
    user_id: string;
    product_id: string;
    name?: string;
}): Promise<CreateCompareSessionResponse> {
    const payload = await postJson<CreateCompareSessionResponse>(
        "/create_session",
        {
            user_id: input.user_id,
            products: [input.product_id],
            name: input.name,
        },
    );

    const sessionId = payload.session?.session_id || payload.data?.session_id || payload.session_id || "";

    if (!sessionId) {
        throw new Error("Failed to create compare session.");
    }

    return {
        ...payload,
        session_id: sessionId,
    };
}

export async function joinCompareSession(input: {
    session_id: string;
    user_id: string;
    product_id: string;
}): Promise<SessionData> {


    let lastError: Error | null = null;


    try {
        const payload = await postJson<{ session?: SessionData; data?: SessionData; session_id?: string }>(
            `/add_product`,
            {
                session_id: input.session_id,
                user_id: input.user_id,
                product_id: input.product_id,
            },
        );

        if (payload.session) {
            return payload.session;
        }

        if (payload.data) {
            return payload.data;
        }


    } catch (error) {
        lastError = error as Error;
    }


    throw lastError ?? new Error("Failed to join compare session.");
}
