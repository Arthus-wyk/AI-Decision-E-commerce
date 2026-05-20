"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getProductBySlug } from "@/lib/api";
import type { Product } from "@/types/product";
import {Drawer} from "antd";
import {AIAssistantSidebar} from "@/components/AI/AIAssistantSidebar";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const timeoutId = window.setTimeout(() => {
      if (!isCurrent) {
        return;
      }
      setIsLoading(true);
      setError(null);
    }, 0);

    getProductBySlug(slug)
      .then((nextProduct) => {
        if (isCurrent) {
          setProduct(nextProduct);
        }
      })
      .catch((requestError: Error) => {
        if (!isCurrent) {
          return;
        }
        setProduct(null);
        setError(
          requestError.message.includes("404")
            ? "Product not found."
            : "Failed to load product. Please try again later."
        );
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
    };
  }, [slug]);
  const showDrawer = () => {
      setOpen(true);
  };

  const onClose = () => {
      setOpen(false);
  };

  return (
    <main className="page-shell">
      <Link className="back-link" href="/products">
        Back to products
      </Link>

      {isLoading ? (
        <div className="state-panel">
          <strong>Loading product...</strong>
          Fetching product details.
        </div>
      ) : error || !product ? (
        <div className="state-panel">
          <strong>{error ?? "Product not found."}</strong>
          Return to the catalog to keep browsing.
        </div>
      ) : (
        <div className="detail-grid">
          <div className="detail-media">
            <img
              className="detail-image"
              src={product.image_url || "https://placehold.co/600x400?text=Product"}
              alt={product.name}
            />
          </div>

          <section className="detail-summary">
            <div className="product-meta">
              {product.category ? <span>{product.category}</span> : null}
              {product.brand ? <span>{product.brand}</span> : null}
            </div>
            <h1>{product.name}</h1>
            <span className="price">{formatter.format(product.price)}</span>
            <span
              className={`stock-badge ${
                product.stock_quantity > 0 ? "in-stock" : "out-stock"
              }`}
            >
              {product.stock_quantity > 0
                ? `${product.stock_quantity} in stock`
                : "Out of stock"}
            </span>
            {product.rating ? <div className="rating">Rating {product.rating.toFixed(1)}</div> : null}
            <p className="detail-description">{product.description}</p>
            <div className="detail-actions">
              {/* TODO: Integrate with Cart module */}
              <button className="primary-button" type="button">
                Add to Cart
              </button>
              {/* TODO: Integrate with AI Assistant module */}
              <button className="secondary-button" type="button" onClick={showDrawer}>
                Ask AI Assistant
              </button>
            </div>
          </section>
        </div>
      )}
        <Drawer
            title="AI Assistant"
            closable={{ 'aria-label': 'Close Button' }}
            onClose={onClose}
            open={open}
        >
            {product && (
                <AIAssistantSidebar
                    user_id="demo_user"
                    product={product}
                    onClose={onClose}
                />
            )}
        </Drawer>
    </main>
  );
}
