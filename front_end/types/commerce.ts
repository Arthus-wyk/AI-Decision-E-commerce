import type { Product } from "@/types/product";

export type User = {
  id: number;
  email: string;
  name?: string | null;
  created_at?: string | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
  line_total: number;
};

export type Cart = {
  items: CartItem[];
  subtotal: number;
  count: number;
};

export type Order = {
  id: number;
  email: string;
  full_name: string;
  address: string;
  city: string;
  country: string;
  phone?: string | null;
  status: string;
  subtotal: number;
  created_at?: string | null;
  items: {
    product_id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
  }[];
};

export type CartDraft = {
  product_id: number;
  quantity: number;
  rationale: string;
};
