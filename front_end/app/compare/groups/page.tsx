"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { HydratedCompareSession } from "@/lib/api";
import { getHydratedCompareSessions } from "@/lib/api";

const DEMO_USER_ID = "demo_user";

export default function CompareGroups() {
  const router = useRouter();

  const [groups, setGroups] = useState<HydratedCompareSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCompareGroups() {
    setLoading(true);
    setError(null);

    try {
      const hydratedSessions = await getHydratedCompareSessions({ user_id: DEMO_USER_ID });
      setGroups(hydratedSessions);
    } catch (requestError) {
      setGroups([]);
      setError((requestError as Error).message || "Failed to load compare groups.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.body.style.margin = "0";

    let canceled = false;

    getHydratedCompareSessions({ user_id: DEMO_USER_ID })
      .then((hydratedSessions) => {
        if (!canceled) {
          setGroups(hydratedSessions);
        }
      })
      .catch((requestError) => {
        if (!canceled) {
          setGroups([]);
          setError((requestError as Error).message || "Failed to load compare groups.");
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px",
        boxSizing: "border-box",
        fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        color: "#172033",
        background: "linear-gradient(160deg, #eff4fb 0%, #f8fbff 55%, #e8f0ff 100%)",
      }}
    >
      <header style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "32px" }}>Compare Groups</h1>
        <p style={{ margin: "8px 0 0", color: "#445268" }}>
          View all existing product comparison groups.
        </p>
      </header>

      <section
        style={{
          background: "#fff",
          border: "1px solid #d9e0ea",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px" }}>Existing Groups</h2>

          <button
            type="button"
            onClick={loadCompareGroups}
            disabled={loading}
            style={{
              border: 0,
              borderRadius: "10px",
              padding: "10px 14px",
              background: "#0b63d8",
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {error ? (
          <div
            style={{
              border: "1px solid #ffd0d0",
              borderRadius: "12px",
              padding: "18px",
              textAlign: "center",
              color: "#b42318",
              background: "#fff8f8",
            }}
          >
            {error}
          </div>
        ) : groups.length === 0 ? (
          <div
            style={{
              border: "1px dashed #c5d0de",
              borderRadius: "12px",
              padding: "28px",
              textAlign: "center",
              color: "#5d6d84",
              background: "#f8fbff",
            }}
          >
            No compare groups found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {groups.map((group) => (
              <article
                key={group.session_id}
                onClick={() => router.push(`/compare/groups/${group.session_id}`)}
                style={{
                  border: "1px solid #d9e0ea",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  background: "#f7faff",
                  cursor: "pointer",
                  transition: "0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                  minHeight: "118px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <strong style={{ fontSize: "16px", color: "#172033", wordBreak: "break-all" }}>
                      {group.name}
                    </strong>

                    <span
                      style={{
                        fontSize: "12px",
                        color: "#0b63d8",
                        background: "#e9f2ff",
                        borderRadius: "999px",
                        padding: "4px 8px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {group.count} products
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: "14px", color: "#445268" }}>
                    User: {group.user_id || "Unknown"}
                  </p>

                  <p style={{ margin: 0, fontSize: "13px", color: "#5d6d84" }}>
                    Created at: {group.created_at || "N/A"}
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "#445268",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {group.products
                      .slice(0, 3)
                      .map((product) => product.name)
                      .join(" / ") || "No products"}
                  </p>
                </div>

                <div
                  style={{
                    width: "148px",
                    height: "90%",
                    position: "relative",
                    flexShrink: 0,
                    alignSelf: "center",
                  }}
                >
                  {group.products.slice(0, 3).map((product, index) => {
                    const imageUrl = product.image_url || "https://placehold.co/148x148?text=Product";

                    return (
                      <div
                        key={`${group.session_id}-${product.product_id ?? product.id}-${index}`}
                        style={{
                          position: "absolute",
                          top: "50%",
                          transform: "translateY(-50%)",
                          right: `${index * 30}px`,
                          width: "74px",
                          height: "74px",
                          borderRadius: "16px",
                          border: "2px solid #fff",
                          overflow: "hidden",
                          boxShadow: "0 4px 10px rgba(15, 23, 42, 0.14)",
                          background: "#edf3ff",
                          zIndex: 10 - index,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={imageUrl}
                          alt={product.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
