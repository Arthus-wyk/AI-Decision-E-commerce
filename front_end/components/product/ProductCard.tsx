import Link from "next/link";

import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.image_url || "https://placehold.co/600x400?text=Product";
  const inStock = product.stock_quantity > 0;

  return (
    <Link className="product-card" href={`/products/${product.slug}`}>
      <div className="product-image-wrap">
        <img className="product-image" src={imageUrl} alt={product.name} />
      </div>
      <div className="product-card-body">
        <div className="product-meta">
          {product.category ? <span>{product.category}</span> : null}
          {product.brand ? <span>{product.brand}</span> : null}
        </div>
        <h3>{product.name}</h3>
        {product.short_description ? (
          <p className="product-description">{product.short_description}</p>
        ) : null}
        <div className="product-card-footer">
          <span className="price">{formatter.format(product.price)}</span>
          <span className={`stock-badge ${inStock ? "in-stock" : "out-stock"}`}>
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}
