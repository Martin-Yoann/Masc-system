"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Switch,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useI18n } from "@/app/I18nProvider";

import {
  ApiError,
  bAdminCreate,
  bAdminDelete,
  bAdminUpdate,
  bAdminsList,
  type BAdminListItem,
  type BPagination,
} from "@/lib/api";

type AdminFormValues = {
  name: string;
  email: string;
  password: string;
  is_super: boolean;
};

export default function AdminsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [form] = Form.useForm<AdminFormValues>();

  const [inputKeyword, setInputKeyword] = useState("");
  const [inputPageSize, setInputPageSize] = useState<number>(15);
  const [keyword, setKeyword] = useState("");
  const [pageSize, setPageSize] = useState<number>(15);
  const [page, setPage] = useState<number>(1);

  const [rows, setRows] = useState<BAdminListItem[]>([]);
  const [pagination, setPagination] = useState<BPagination>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<BAdminListItem | null>(null);
  const [pendingFormValues, setPendingFormValues] =
    useState<AdminFormValues | null>(null);

  const fetchList = () => {
    setLoading(true);
    setError(null);
    return bAdminsList({ keyword, page, page_size: pageSize })
      .then((res) => {
        setRows(res.data.list);
        setPagination(res.data.pagination);
      })
      .catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message : t("common.loadingFailed");
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    bAdminsList({ keyword, page, page_size: pageSize })
      .then((res) => {
        if (!mounted) return;
        setRows(res.data.list);
        setPagination(res.data.pagination);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setError(e instanceof ApiError ? e.message : t("common.loadingFailed"));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [keyword, page, pageSize]);

  const columns = useMemo(
    () => [
      { title: t("users.id"), dataIndex: "id", width: 80 },
      { title: t("users.name"), dataIndex: "name" },
      { title: t("users.email"), dataIndex: "email" },
      {
        title: t("admins.type"),
        dataIndex: "is_super",
        render: (v: boolean) =>
          v ? <Tag color="red">{t("admins.super")}</Tag> : <Tag>{t("admins.normal")}</Tag>,
        width: 140,
      },
      { title: t("admins.createdAt"), dataIndex: "created_at", width: 180 },
      {
        title: t("common.edit"),
        key: "actions",
        width: 180,
        render: (_: unknown, record: BAdminListItem) => (
          <Space>
            <Button
              type="link"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(record);
                setPendingFormValues({
                  name: record.name,
                  email: record.email,
                  password: "",
                  is_super: record.is_super,
                });
                setModalOpen(true);
              }}
            >
              {t("common.edit")}
            </Button>
            <Popconfirm
              title={t("common.confirmDelete")}
              okText={t("common.delete")}
              cancelText={t("common.cancel")}
              onConfirm={async (e) => {
                e?.stopPropagation();
                try {
                  await bAdminDelete(record.id);
                  message.success(t("common.deleteSuccess"));
                  await fetchList();
                } catch (err: unknown) {
                  const msg =
                    err instanceof ApiError ? err.message : t("common.deleteFailed");
                  message.error(msg);
                }
              }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <Button
                type="link"
                danger
                onClick={(e) => e.stopPropagation()}
              >
                {t("common.delete")}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [form, t],
  );

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

  const openCreate = () => {
    setEditing(null);
    setPendingFormValues({
      name: "",
      email: "",
      password: "",
      is_super: false,
    });
    setModalOpen(true);
  };

  const onSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        const payload: {
          name: string;
          email: string;
          is_super: boolean;
          password?: string;
        } = {
          name: values.name,
          email: values.email,
          is_super: values.is_super,
        };
        if (values.password?.trim()) payload.password = values.password.trim();
        await bAdminUpdate(editing.id, payload);
        message.success(t("common.updateSuccess"));
      } else {
        const password = values.password?.trim();
        if (!password) {
          message.error(t("common.required"));
          return;
        }
        await bAdminCreate({
          name: values.name,
          email: values.email,
          password,
          is_super: values.is_super,
        });
        message.success(t("common.createSuccess"));
      }
      setModalOpen(false);
      setPage(1);
      await fetchList();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : t("common.saveFailed");
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder={t("admins.keywordPlaceholder")}
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
        <Button type="primary" onClick={openCreate}>
          {t("admins.create")}
        </Button>
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
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current_page,
          pageSize: pagination.per_page,
          total: pagination.total,
          showSizeChanger: false,
        }}
        onRow={(record) => ({
          onClick: () => router.push(`/admins/${record.id}`),
          style: { cursor: "pointer" },
        })}
        onChange={(p) => setPage(p.current ?? 1)}
      />

      <Modal
        title={editing ? t("admins.editTitle") : t("admins.createTitle")}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        afterOpenChange={(open) => {
          if (!open || !pendingFormValues) return;
          form.setFieldsValue(pendingFormValues);
          setPendingFormValues(null);
        }}
        onOk={onSave}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label={t("users.name")}
            name="name"
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={t("users.email")}
            name="email"
            rules={[
              { required: true, message: t("common.required") },
              { type: "email", message: t("common.required") },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label={editing ? t("admins.passwordOptional") : t("admins.password")}
            name="password"
            rules={
              editing
                ? []
                : [{ required: true, message: t("common.required") }]
            }
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label={t("admins.superToggle")}
            name="is_super"
            valuePropName="checked"
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

