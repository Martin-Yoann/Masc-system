"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Input, InputNumber, Space, Table, Tag, Typography } from "antd";

import { ApiError, bUsersList, type BUser, type BPagination } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/I18nProvider";

export default function UsersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const tableWrapRef = useRef<HTMLDivElement | null>(null);
  const [tableWrapHeight, setTableWrapHeight] = useState(520);

  const [inputKeyword, setInputKeyword] = useState("");
  const [inputPageSize, setInputPageSize] = useState<number>(15);

  const [keyword, setKeyword] = useState("");
  const [pageSize, setPageSize] = useState<number>(15);
  const [page, setPage] = useState<number>(1);

  const [rows, setRows] = useState<BUser[]>([]);
  const [pagination, setPagination] = useState<BPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(
    () => [
      { title: t("users.id"), dataIndex: "id", width: 80 },
      { title: t("users.name"), dataIndex: "name" },
      { title: t("users.email"), dataIndex: "email" },
      {
        title: t("users.emailVerified"),
        dataIndex: "email_verified_at",
        render: (v: string | null) =>
          v ? <Tag color="green">{t("users.verified")}</Tag> : <Tag>{t("users.unverified")}</Tag>,
        width: 120,
      },
      { title: t("users.createdAt"), dataIndex: "created_at", width: 180 },
    ],
    [t],
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    bUsersList({ keyword, page, page_size: pageSize })
      .then((res) => {
        if (!mounted) return;
        setRows(res.data.list);
        setPagination(res.data.pagination);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        const msg =
          e instanceof ApiError ? e.message : t("common.loadingFailed");
        setError(msg);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [keyword, page, pageSize]);

  const applySearch = () => {
    const nextSize =
      Number.isFinite(inputPageSize) && inputPageSize > 0
        ? Math.min(inputPageSize, 200)
        : 15;
    setKeyword(inputKeyword.trim());
    setPageSize(nextSize);
    setPage(1);
  };

  const reset = () => {
    setInputKeyword("");
    setInputPageSize(15);
    setKeyword("");
    setPageSize(15);
    setPage(1);
  };

  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setTableWrapHeight(el.clientHeight);
    });
    ro.observe(el);
    setTableWrapHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const tableScrollY = Math.max(240, tableWrapHeight - 56);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Space wrap style={{ marginBottom: 16, flex: "0 0 auto" }}>
        <Input
          placeholder={t("users.keywordPlaceholder")}
          value={inputKeyword}
          onChange={(e) => setInputKeyword(e.target.value)}
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
            onChange={(v) => setInputPageSize(v ?? 15)}
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

      <div ref={tableWrapRef} style={{ flex: 1, minHeight: 0 }}>
        <Table
          sticky
          scroll={{ y: tableScrollY }}
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current_page,
            pageSize: pagination.per_page,
            total: pagination.total,
            showSizeChanger: false,
          }}
          onRow={(record) => ({
            onClick: () => router.push(`/users/${record.id}`),
            style: { cursor: "pointer" },
          })}
          onChange={(p) => {
            const nextPage = p.current ?? 1;
            if (nextPage !== page) setPage(nextPage);
          }}
        />
      </div>
    </div>
  );
}
