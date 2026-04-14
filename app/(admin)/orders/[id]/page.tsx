"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Descriptions, Skeleton, Space, Tag } from "antd";
import { useParams, useRouter } from "next/navigation";

import { ApiError, bOrderDetail, type BOrderDetail } from "@/lib/api";
import { useI18n } from "@/app/I18nProvider";

function getOrderStatusColor(status: string) {
  switch (status) {
    case "paid":
      return "green";
    case "refunded":
      return "red";
    case "contacted":
      return "blue";
    case "canceled":
      return "default";
    default:
      return "orange";
  }
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<BOrderDetail | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bOrderDetail(id);
      setOrder(res.data);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : t("common.loadingFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Space>
        <Button onClick={() => router.back()}>{t("common.back")}</Button>
      </Space>

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {loading ? (
        <Skeleton active />
      ) : order ? (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label={t("orders.orderNo")}>{order.order_no}</Descriptions.Item>
          <Descriptions.Item label={t("orders.user")}>{order.user?.name || "-"}</Descriptions.Item>
          <Descriptions.Item label={t("orders.userEmail")}>
            {order.user?.email || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.product")}>
            {order.product?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.description")}>
            {order.product?.description || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.price")}>{order.price}</Descriptions.Item>
          <Descriptions.Item label={t("orders.currency")}>{order.currency || "-"}</Descriptions.Item>
          <Descriptions.Item label={t("orders.status")}>
            <Tag color={getOrderStatusColor(order.status)}>{t(`orders.status.${order.status}`)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.buyerMessage")}>
            {order.buyer_message || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.preferredContactTime")}>
            {order.preferred_contact_time || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.contactMethod")}>
            {order.contact_method || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.paidAt")}>{order.paid_at || "-"}</Descriptions.Item>
          <Descriptions.Item label={t("orders.contactedAt")}>
            {order.contacted_at || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.refundedAt")}>
            {order.refunded_at || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.canceledAt")}>
            {order.canceled_at || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("orders.createdAt")}>
            {order.created_at || "-"}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert type="warning" showIcon message={t("orders.notFound")} />
      )}
    </Space>
  );
}
