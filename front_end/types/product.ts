export type Product = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category?: string;
  brand?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  rating?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
};

export type ProductQueryParams = {
  q?: string;
  category?: string;
  brand?: string;
  min_price?: string | number;
  max_price?: string | number;
  in_stock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "rating_desc";
  page?: number;
  page_size?: number;
};
