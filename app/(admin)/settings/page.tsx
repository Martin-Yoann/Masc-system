"use client";

import { Alert, Button, Card, Divider, Form, Input, Skeleton, message } from "antd";
import { useEffect, useState } from "react";
import { useI18n } from "@/app/I18nProvider";
import { ApiError, bAdminMe, bAdminUpdate, type BAdmin } from "@/lib/api";

const ADMIN_PROFILE_UPDATED_EVENT = "admin:profile-updated";

export default function SettingsPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<BAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    bAdminMe()
      .then((res) => {
        if (!mounted) return;
        setMe(res.data);
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
  }, [t]);

  const onFinish = async (values: {
    name: string;
    email: string;
    password?: string;
    confirm?: string;
  }) => {
    if (!me) return;
    const password = values.password?.trim();
    const confirm = values.confirm?.trim();
    if (password || confirm) {
      if (!password || !confirm) {
        message.error(t("common.required"));
        return;
      }
      if (password !== confirm) {
        message.error(t("common.passwordsMismatch"));
        return;
      }
    }

    setSaving(true);
    try {
      await bAdminUpdate(me.id, {
        name: values.name.trim(),
        email: values.email.trim(),
        is_super: me.is_super,
        ...(password ? { password } : {}),
      });
      message.success(t("common.updateSuccess"));
      const refreshed = await bAdminMe();
      setMe(refreshed.data);
      window.dispatchEvent(new Event(ADMIN_PROFILE_UPDATED_EVENT));
    } catch (e: unknown) {
      message.error(e instanceof ApiError ? e.message : t("common.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title={t("nav.settings")} style={{ maxWidth: 700 }}>
      {error ? (
        <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} />
      ) : null}

      {loading ? (
        <Skeleton active />
      ) : (
        <Form
          key={`${me?.id ?? "new"}-${me?.name ?? ""}`}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            name: me?.name ?? "",
            email: me?.email ?? "",
            password: "",
            confirm: "",
          }}
        >
          <Form.Item
            name="name"
            label={t("users.name")}
            rules={[{ required: true, message: t("common.required") }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label={t("login.email")}
            rules={[
              { required: true, message: t("common.required") },
              { type: "email", message: t("common.required") },
            ]}
          >
            <Input />
          </Form.Item>

          <Divider>Security</Divider>

          <Form.Item name="password" label="New password">
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item name="confirm" label="Confirm password">
            <Input.Password placeholder="Re-enter password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save
            </Button>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
}

