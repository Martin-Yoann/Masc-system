"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Descriptions, Skeleton, Space } from "antd";
import { useParams, useRouter } from "next/navigation";

import { ApiError, bUserDetail, type BUserDetail } from "@/lib/api";
import { useI18n } from "@/app/I18nProvider";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { t } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<BUserDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    bUserDetail(id)
      .then((res) => {
        if (!mounted) return;
        setUser(res.data);
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
  }, [id]);

  return (
    <Space orientation="vertical" size={16} style={{ width: "100%" }}>
      <Space>
        <Button onClick={() => router.back()}>{t("common.back")}</Button>
      </Space>

      {error ? <Alert type="error" showIcon message={error} /> : null}

      {loading ? (
        <Skeleton active />
      ) : user ? (
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label={t("users.id")}>{user.id}</Descriptions.Item>
          <Descriptions.Item label={t("users.name")}>{user.name}</Descriptions.Item>
          <Descriptions.Item label={t("users.email")}>{user.email}</Descriptions.Item>
          <Descriptions.Item label={t("users.emailVerifiedAt")}>
            {user.email_verified_at || "-"}
          </Descriptions.Item>
          <Descriptions.Item label={t("users.createdAt")}>{user.created_at}</Descriptions.Item>
          <Descriptions.Item label={t("users.updatedAt")}>{user.updated_at}</Descriptions.Item>
        </Descriptions>
      ) : (
        <Alert type="warning" showIcon message={t("users.notFound")} />
      )}
    </Space>
  );
}

