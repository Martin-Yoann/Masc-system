"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Input, InputNumber, Modal, Space, Table, Tag, Typography, message } from "antd";
import { useRouter } from "next/navigation";

import {
  ApiError,
  bOrderContact,
  bOrderInvoice,
  bOrderPay,
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
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceOrderNo, setInvoiceOrderNo] = useState<string | null>(null);
  const [invoiceForm] = Form.useForm<{ invoice_no: string; internal_note: string }>();

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

  const runOrderAction = useCallback(
    async (orderNoValue: string, task: () => Promise<unknown>, successText: string) => {
      setActingOrderNo(orderNoValue);
      try {
        await task();
        message.success(successText);
        await fetchList();
      } catch (err: unknown) {
        message.error(err instanceof ApiError ? err.message : t("common.saveFailed"));
      } finally {
        setActingOrderNo(null);
      }
    },
    [fetchList, t],
  );

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
        width: 480,
        render: (_: unknown, record: BOrderListItem) => {
          const busy = actingOrderNo === record.order_no;
          const contacted = Boolean(record.contacted_at) || record.status === "contacted";
          const refunded = Boolean(record.refunded_at) || record.status === "refunded";
          const canceled = record.status === "canceled";
          const paid = Boolean(record.paid_at) || record.status === "paid";

          const canContact = !busy && !contacted && !refunded && !canceled;
          const canRefund = !busy && !refunded && !canceled;
          const canPay = !busy && !paid && !refunded && !canceled;
          // Invoice should only be sent after payment and before cancellation/refund.
          const canInvoice = !busy && paid && !refunded && !canceled;
          const hasAnyBlocked = !canContact || !canRefund || !canPay || !canInvoice;

          return (
            <Space>
              <Button
                type="link"
                disabled={!canContact}
                loading={busy}
                onClick={async (e) => {
                  e.stopPropagation();
                  await runOrderAction(
                    record.order_no,
                    () => bOrderContact(record.order_no),
                    t("orders.contactSuccess"),
                  );
                }}
              >
                {t("orders.markContacted")}
              </Button>
              <Button
                type="link"
                danger
                disabled={!canRefund}
                loading={busy}
                onClick={async (e) => {
                  e.stopPropagation();
                  await runOrderAction(
                    record.order_no,
                    () => bOrderRefund(record.order_no),
                    t("orders.refundSuccess"),
                  );
                }}
              >
                {t("orders.markRefunded")}
              </Button>
              <Button
                type="link"
                disabled={!canPay}
                loading={busy}
                onClick={async (e) => {
                  e.stopPropagation();
                  await runOrderAction(
                    record.order_no,
                    () => bOrderPay(record.order_no),
                    t("orders.paySuccess"),
                  );
                }}
              >
                {t("orders.markPaid")}
              </Button>
              <Button
                type="link"
                disabled={!canInvoice}
                loading={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  setInvoiceOrderNo(record.order_no);
                  invoiceForm.setFieldsValue({ invoice_no: "", internal_note: "" });
                  setInvoiceOpen(true);
                }}
              >
                {t("orders.sendInvoice")}
              </Button>
              <Button
                type="link"
                disabled={!hasAnyBlocked}
                onClick={(e) => {
                  e.stopPropagation();
                  const lines: string[] = [];
                  if (!canContact) lines.push(`- ${t("orders.markContacted")}：当前状态不可操作`);
                  if (!canRefund) lines.push(`- ${t("orders.markRefunded")}：当前状态不可操作`);
                  if (!canPay) lines.push(`- ${t("orders.markPaid")}：当前状态不可操作`);
                  if (!canInvoice) lines.push(`- ${t("orders.sendInvoice")}：仅已支付且未退款/未取消可操作`);
                  Modal.info({
                    title: `${t("orders.orderNo")}: ${record.order_no}`,
                    content: (
                      <div style={{ whiteSpace: "pre-line" }}>
                        {lines.length ? lines.join("\n") : "-"}
                      </div>
                    ),
                  });
                }}
              >
                操作说明
              </Button>
            </Space>
          );
        },
      },
    ],
    [actingOrderNo, invoiceForm, runOrderAction, t],
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

      <Modal
        title={t("orders.sendInvoice")}
        open={invoiceOpen}
        onCancel={() => setInvoiceOpen(false)}
        onOk={async () => {
          if (!invoiceOrderNo) return;
          try {
            const values = await invoiceForm.validateFields();
            await runOrderAction(
              invoiceOrderNo,
              () =>
                bOrderInvoice(invoiceOrderNo, {
                  invoice_no: values.invoice_no.trim(),
                  internal_note: values.internal_note.trim(),
                }),
              t("orders.invoiceSuccess"),
            );
            setInvoiceOpen(false);
          } catch {
            // validation handled by form
          }
        }}
        confirmLoading={actingOrderNo === invoiceOrderNo}
        destroyOnHidden
      >
        <Form form={invoiceForm} layout="vertical">
          <Form.Item
            name="invoice_no"
            label={t("orders.invoiceNo")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input placeholder={t("orders.invoiceNoPlaceholder")} />
          </Form.Item>
          <Form.Item
            name="internal_note"
            label={t("orders.internalNote")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input.TextArea rows={3} placeholder={t("orders.internalNotePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
