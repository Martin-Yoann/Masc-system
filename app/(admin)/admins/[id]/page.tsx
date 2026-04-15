"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Descriptions, Skeleton, Space, Tag } from "antd";
import { useParams, useRouter } from "next/navigation";

import { ApiError, bAdminDetail, type BAdminDetail } from "@/lib/api";
import { useI18n } from "@/app/I18nProvider";

export default function AdminDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState<BAdminDetail | null>(null);

  const loadAdmin = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bAdminDetail(id);
      setAdmin(res.data);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : t("common.loadingFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Space>
        <Button onClick={() => router.back()}>{t("common.back")}</Button>
      </Space>

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {loading ? (
        <Skeleton active />
      ) : admin ? (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label={t("users.id")}>{admin.id}</Descriptions.Item>
          <Descriptions.Item label={t("users.name")}>{admin.name}</Descriptions.Item>
          <Descriptions.Item label={t("users.email")}>{admin.email}</Descriptions.Item>
          <Descriptions.Item label={t("admins.type")}>
            {admin.is_super ? (
              <Tag color="red">{t("admins.super")}</Tag>
            ) : (
              <Tag>{t("admins.normal")}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t("admins.createdAt")}>{admin.created_at}</Descriptions.Item>
          <Descriptions.Item label={t("users.updatedAt")}>{admin.updated_at}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert type="warning" showIcon message={t("admins.notFound")} />
      )}
    </Space>
  );
}

