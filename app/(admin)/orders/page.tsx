"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Input, InputNumber, Space, Table, Tag, Typography, message } from "antd";
import { useRouter } from "next/navigation";

import {
  ApiError,
  bOrderContact,
  bOrderRefund,
  bOrdersList,
  type BOrderListItem,
  type BPagination,
} from "@/lib/api";
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

export default function OrdersPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [inputOrderNo, setInputOrderNo] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [inputPageSize, setInputPageSize] = useState<number>(16);
  const [pageSize, setPageSize] = useState<number>(16);
  const [page, setPage] = useState<number>(1);

  const [rows, setRows] = useState<BOrderListItem[]>([]);
  const [pagination, setPagination] = useState<BPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 16,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingOrderNo, setActingOrderNo] = useState<string | null>(null);

  const fetchList = useCallback(async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bOrdersList({ order_no: orderNo, page: nextPage, per_page: nextPageSize });
      setRows(res.data.list);
      setPagination(res.data.pagination);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : t("common.loadingFailed"));
    } finally {
      setLoading(false);
    }
  }, [orderNo, page, pageSize, t]);

  useEffect(() => {
    void fetchList(page, pageSize);
  }, [fetchList, page, pageSize]);

  const columns = useMemo(
    () => [
      { title: t("orders.orderNo"), dataIndex: "order_no", width: 220 },
      {
        title: t("orders.user"),
        key: "user",
        render: (_: unknown, record: BOrderListItem) => (
          <div>
            <div>{record.user?.name || "-"}</div>
            <Typography.Text type="secondary">{record.user?.email || "-"}</Typography.Text>
          </div>
        ),
        width: 220,
      },
      {
        title: t("orders.product"),
        key: "product",
        render: (_: unknown, record: BOrderListItem) => record.product?.name || "-",
        width: 150,
      },
      { title: t("orders.price"), dataIndex: "price", width: 100 },
      {
        title: t("orders.status"),
        dataIndex: "status",
        width: 120,
        render: (status: string) => (
          <Tag color={getOrderStatusColor(status)}>{t(`orders.status.${status}`)}</Tag>
        ),
      },
      { title: t("orders.paidAt"), dataIndex: "paid_at", width: 180, render: (v: string | null) => v || "-" },
      {
        title: t("orders.contactedAt"),
        dataIndex: "contacted_at",
        width: 180,
        render: (v: string | null) => v || "-",
      },
      { title: t("orders.createdAt"), dataIndex: "created_at", width: 180 },
      {
        title: t("common.edit"),
        key: "actions",
        width: 220,
        render: (_: unknown, record: BOrderListItem) => {
          const busy = actingOrderNo === record.order_no;
          const contacted = Boolean(record.contacted_at);
          const refunded = Boolean(record.refunded_at) || record.status === "refunded";

          return (
            <Space>
              <Button
                type="link"
                disabled={contacted || busy}
                loading={busy && !refunded}
                onClick={async (e) => {
                  e.stopPropagation();
                  setActingOrderNo(record.order_no);
                  try {
                    await bOrderContact(record.order_no);
                    message.success(t("orders.contactSuccess"));
                    await fetchList();
                  } catch (err: unknown) {
                    message.error(err instanceof ApiError ? err.message : t("common.saveFailed"));
                  } finally {
                    setActingOrderNo(null);
                  }
                }}
              >
                {t("orders.markContacted")}
              </Button>
              <Button
                type="link"
                danger
                disabled={refunded || busy}
                loading={busy && refunded}
                onClick={async (e) => {
                  e.stopPropagation();
                  setActingOrderNo(record.order_no);
                  try {
                    await bOrderRefund(record.order_no);
                    message.success(t("orders.refundSuccess"));
                    await fetchList();
                  } catch (err: unknown) {
                    message.error(err instanceof ApiError ? err.message : t("common.saveFailed"));
                  } finally {
                    setActingOrderNo(null);
                  }
                }}
              >
                {t("orders.markRefunded")}
              </Button>
            </Space>
          );
        },
      },
    ],
    [actingOrderNo, fetchList, t],
  );

  const applySearch = () => {
    const nextSize =
      Number.isFinite(inputPageSize) && inputPageSize > 0
        ? Math.min(inputPageSize, 200)
        : 16;
    setOrderNo(inputOrderNo.trim());
    setPageSize(nextSize);
    setPage(1);
  };

  const reset = () => {
    setInputOrderNo("");
    setOrderNo("");
    setInputPageSize(16);
    setPageSize(16);
    setPage(1);
  };

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder={t("orders.orderNoPlaceholder")}
          value={inputOrderNo}
          onChange={(e) => setInputOrderNo(e.target.value)}
          onPressEnter={applySearch}
          allowClear
          style={{ width: 240 }}
        />
        <Space.Compact>
          <Typography.Text
            style={{
              paddingInline: 10,
              border: "1px solid #d9d9d9",
              borderRight: 0,
              borderRadius: "6px 0 0 6px",
              display: "inline-flex",
              alignItems: "center",
              height: 32,
              background: "#fafafa",
              color: "rgba(0,0,0,0.65)",
            }}
          >
            {t("common.pageSize")}
          </Typography.Text>
          <InputNumber
            min={1}
            max={200}
            value={inputPageSize}
            onChange={(v) => setInputPageSize(v ?? 16)}
            style={{ width: 140 }}
          />
        </Space.Compact>
        <Button type="primary" onClick={applySearch}>
          {t("common.search")}
        </Button>
        <Button onClick={reset}>{t("common.reset")}</Button>
      </Space>

      {error ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          message={error}
        />
      ) : null}

      <Table
        columns={columns}
        dataSource={rows}
        rowKey="order_no"
        loading={loading}
        scroll={{ x: 1450 }}
        pagination={{
          current: pagination.current_page,
          pageSize: pagination.per_page,
          total: pagination.total,
          showSizeChanger: false,
        }}
        onRow={(record) => ({
          onClick: () => router.push(`/orders/${encodeURIComponent(record.order_no)}`),
          style: { cursor: "pointer" },
        })}
        onChange={(p) => setPage(p.current ?? 1)}
      />
    </>
  );
}
