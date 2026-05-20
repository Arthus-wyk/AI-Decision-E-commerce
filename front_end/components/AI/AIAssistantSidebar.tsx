"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, Input, List, Modal, Skeleton, Tag, message } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  FolderOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { createCompareSession, getHydratedCompareSessions, joinCompareSession } from "@/lib/api";
import type { HydratedCompareSession } from "@/lib/api";
import type { Product } from "@/types/product";

interface AIAssistantSidebarProps {
  user_id: string;
  product: Product;
  onClose: () => void;
}

export function AIAssistantSidebar({ user_id, product, onClose }: AIAssistantSidebarProps) {
  const router = useRouter();
  const [createForm] = Form.useForm<{ name: string }>();
  const [groups, setGroups] = useState<HydratedCompareSession[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState("");
  const [createdSessionMessage, setCreatedSessionMessage] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const currentProductId = String(product.id);

  const isProductInGroup = (group: HydratedCompareSession) =>
    group.products.some((groupProduct) => {
      const groupProductId = String(groupProduct.product_id ?? groupProduct.id);
      return groupProductId === currentProductId;
    });

  async function loadGroups() {
    setGroupsLoading(true);

    try {
      const hydratedSessions = await getHydratedCompareSessions({ user_id });
      setGroups(hydratedSessions);
    } catch (error) {
      setGroups([]);
      messageApi.error((error as Error).message || "Failed to load compare groups.");
    } finally {
      setGroupsLoading(false);
    }
  }

  useEffect(() => {
    let canceled = false;

    getHydratedCompareSessions({ user_id })
      .then((hydratedSessions) => {
        if (!canceled) {
          setGroups(hydratedSessions);
        }
      })
      .catch((error) => {
        if (!canceled) {
          setGroups([]);
          messageApi.error((error as Error).message || "Failed to load compare groups.");
        }
      })
      .finally(() => {
        if (!canceled) {
          setGroupsLoading(false);
        }
      });

    return () => {
      canceled = true;
    };
  }, [user_id, messageApi]);

  const goToComparePage = (sessionId: string) => {
    router.push(`/compare/groups/${sessionId}`);
    onClose();
  };

  const openCreateGroupModal = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const closeCreateGroupModal = () => {
    setCreateModalOpen(false);
    createForm.resetFields();
  };

  const handleCreateGroup = async () => {
    setCreatingLoading(true);
    try {
      const { name } = await createForm.validateFields();
      const product_id = String(product.id);
      const session = await createCompareSession({
        user_id,
        product_id: product_id,
        name,
      });

      setCreatedSessionId(session.session_id);
      setCreatedSessionMessage(session.message || "session saved");
      setCreateModalOpen(false);
      setSuccessModalOpen(true);
      await loadGroups();
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) {
        return;
      }

      messageApi.error((error as Error).message || "Failed to create compare group.");
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleJoinGroup = async (sessionId: string) => {
    const selectedGroup = groups.find((group) => group.session_id === sessionId);
    if (selectedGroup && isProductInGroup(selectedGroup)) {
      messageApi.warning("This product is already in the selected group.");
      return;
    }

    setActionLoadingId(sessionId);
    try {
      await joinCompareSession({
        session_id: sessionId,
        user_id,
        product_id: currentProductId,
      });

      messageApi.success("Added products to the selected group.");
      goToComparePage(sessionId);
    } catch (error) {
      messageApi.error((error as Error).message || "Failed to join compare group.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 16,
        paddingRight: 2,
      }}
    >
      {contextHolder}

      <Modal
        title="Create group"
        open={createModalOpen}
        onCancel={closeCreateGroupModal}
        onOk={handleCreateGroup}
        confirmLoading={creatingLoading}
        okText="Create"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" preserve={false} initialValues={{ name: "" }}>
          <Form.Item
            label="Group name"
            name="name"
            rules={[
              { required: true, message: "Please enter a group name." },
              { whitespace: true, message: "Please enter a group name." },
            ]}
          >
            <Input placeholder="Enter a name for this group" maxLength={64} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Group created"
        open={successModalOpen}
        onCancel={() => setSuccessModalOpen(false)}
        footer={[
          <Button
            key="later"
            onClick={() => {
              setSuccessModalOpen(false);
            }}
          >
            Later
          </Button>,
          <Button
            key="go-now"
            type="primary"
            onClick={() => {
              setSuccessModalOpen(false);
              goToComparePage(createdSessionId);
            }}
          >
            Go now
          </Button>,
        ]}
        destroyOnHidden
      >
        <p style={{ marginTop: 0, marginBottom: 8 }}>{createdSessionMessage}</p>
        <p style={{ margin: 0, color: "#5d6d84" }}>
          The group was created successfully. Do you want to go to the group now?
        </p>

      </Modal>

      <section
        style={{
          borderRadius: 16,
          padding: 16,
          background: "linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)",
          border: "1px solid #d9e0ea",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>


          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateGroupModal}
            loading={creatingLoading}
          >
            Create group
          </Button>
        </div>
      </section>

      <section
        style={{
          flex: 1,
          minHeight: 0,
          borderRadius: 16,
          padding: 16,
          background: "#fff",
          border: "1px solid #d9e0ea",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.05)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: "#5d6d84" }}>Existing groups</p>
            <h3 style={{ margin: "4px 0 0", fontSize: 20, color: "#172033" }}>
              {groups.length} session{groups.length === 1 ? "" : "s"}
            </h3>
          </div>

          <Button onClick={loadGroups} disabled={groupsLoading}>
            Refresh
          </Button>
        </div>

        <div style={{ marginTop: 14, minHeight: 0, overflowY: "auto", flex: 1 }}>
          {groupsLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : groups.length === 0 ? (
            <div
              style={{
                border: "1px dashed #c5d0de",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
                color: "#5d6d84",
                background: "#f8fbff",
              }}
            >
              No compare groups found.
            </div>
          ) : (
            <List
              dataSource={groups}
              renderItem={(group) => {
                const isLoading = actionLoadingId === group.session_id;
                const alreadyInGroup = isProductInGroup(group);

                return (
                  <List.Item key={group.session_id} style={{ padding: 0, marginBottom: 12, border: 0 }}>
                    <article
                      onClick={() => goToComparePage(group.session_id)}
                      style={{
                        width: "100%",
                        cursor: "pointer",
                        border: "1px solid #d9e0ea",
                        borderRadius: 14,
                        padding: 14,
                        background: "#f7faff",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        transition: "0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <FolderOutlined style={{ color: "#0b63d8", flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 600,
                                color: "#172033",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {group.name}
                            </div>
                          </div>
                        </div>

                        <Tag color="blue">{group.count} products</Tag>
                      </div>

                      <div style={{ display: "flex", gap: 8, overflow: "hidden" }}>
                        {group.products.slice(0, 3).map((product) => (
                          <div
                            key={`${group.session_id}-${product.product_id ?? product.id}`}
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 12,
                              overflow: "hidden",
                              border: "1px solid #d9e0ea",
                              background: "#eef3f9",
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={product.image_url || "https://placehold.co/96x96?text=Product"}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        ))}

                        {group.products.length === 0 ? (
                          <span style={{ fontSize: 12, color: "#7b8aa0" }}>No products in this session.</span>
                        ) : null}
                      </div>

                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Button
                          size="small"
                          icon={<ArrowRightOutlined />}
                          onClick={(event) => {
                            event.stopPropagation();
                            goToComparePage(group.session_id);
                          }}
                        >
                          Open
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          icon={isLoading ? <CheckCircleFilled /> : <PlusOutlined />}
                          loading={isLoading}
                          disabled={alreadyInGroup}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleJoinGroup(group.session_id);
                          }}
                        >
                          {alreadyInGroup ? "Already added" : "Join group"}
                        </Button>
                      </div>
                    </article>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
