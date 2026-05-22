import type { Product } from "@/types/product";

export type User = {
  id: number;
  email: string;
  name?: string | null;
  is_superadmin: boolean;
  is_active: boolean;
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

export type AdminOverview = {
  product_count: number;
  active_product_count: number;
  user_count: number;
  active_user_count: number;
  order_count: number;
  revenue_subtotal: number;
};

export type AdminUserList = {
  items: User[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminOrderList = {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
};
