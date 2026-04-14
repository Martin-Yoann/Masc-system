"use client";

import React, { useEffect, useRef, useState } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, bAdminLogin, bAdminUpdate, bAdminsList } from "@/lib/api";
import { useI18n } from "@/app/I18nProvider";

const { Title, Text } = Typography;

/** 仅允许站内相对路径，避免 open redirect 与 /login 循环 */
function sanitizeInternalNextPath(raw: string | null): string {
  if (!raw || raw === "/login") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const { t } = useI18n();
  const nextRef = useRef<string>("/");
  const [loginForm] = Form.useForm();
  const [resetForm] = Form.useForm();

  useEffect(() => {
    const rawNext = searchParams.get("next");
    const next = sanitizeInternalNextPath(rawNext);
    nextRef.current = next;

    // Hide query string in address bar, but preserve next target.
    if (rawNext) {
      router.replace("/login");
    }
  }, [router, searchParams]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await bAdminLogin(values);
      message.success(res.message || t("login.success"));
      router.replace(nextRef.current || "/");
      router.refresh();
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  const onResetFinish = async (values: {
    name: string;
    email: string;
    password: string;
    confirm: string;
  }) => {
    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();
    const password = values.password.trim();
    const confirm = values.confirm.trim();

    if (password !== confirm) {
      message.error(t("common.passwordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      // Find matching admin by keyword search, then exact match on name+email.
      const listRes = await bAdminsList({ keyword: email, page: 1, page_size: 50 });
      const match = listRes.data.list.find(
        (a) => a.email.toLowerCase() === email && a.name === name,
      );
      if (!match) {
        message.error(t("login.resetNotFound"));
        return;
      }

      await bAdminUpdate(match.id, {
        name: match.name,
        email: match.email,
        is_super: match.is_super,
        password,
      });

      message.success(t("login.resetSuccess"));
      resetForm.resetFields();
      setMode("login");
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 401) {
        message.error(t("login.resetUnauthorized"));
        setMode("login");
      } else {
        const msg = e instanceof ApiError ? e.message : t("login.resetFailed");
        message.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* 左侧品牌区域 */}
      <div className="auth-left">
        <div className="brand-container">
          <div className="logo-wrapper">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" fill="#E5000B" opacity="0.15" />
              <circle cx="100" cy="100" r="50" fill="#E5000B" opacity="0.3" />
              <circle cx="100" cy="100" r="25" fill="#E5000B" />
              <path
                d="M100 70 L115 100 L100 130 L85 100 Z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>
          <Title level={1} className="brand-title">
            {t("app.brand")}
          </Title>
          <Text className="brand-subtitle">
            {t("login.subtitle")}
          </Text>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="auth-right">
        <Card className="login-card" variant="borderless">
          <div className="card-header">
            <Title level={2} className="welcome-title">
              {mode === "login" ? t("login.welcomeTitle") : t("login.resetTitle")}
            </Title>
            <Text className="welcome-subtitle">
              {mode === "login" ? t("login.welcomeSubtitle") : t("login.resetSubtitle")}
            </Text>
          </div>

          <div style={{ display: mode === "login" ? "block" : "none" }}>
            <Form
              form={loginForm}
              layout="vertical"
              size="large"
              onFinish={onFinish}
              requiredMark={false}
            >
              <Form.Item
                name="email"
                label={t("login.email")}
                rules={[
                  { required: true, message: t("common.required") },
                  { type: "email", message: t("login.email") },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder={t("login.emailPlaceholder")}
                  className="custom-input"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={t("login.password")}
                rules={[{ required: true, message: t("common.required") }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder={t("login.passwordPlaceholder")}
                  className="custom-input"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  className="submit-button"
                >
                  {t("login.submit")}
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div style={{ display: mode === "reset" ? "block" : "none" }}>
            <Form
              form={resetForm}
              layout="vertical"
              size="large"
              onFinish={onResetFinish}
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label={t("login.name")}
                rules={[{ required: true, message: t("common.required") }]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder={t("login.namePlaceholder")}
                  className="custom-input"
                  autoComplete="name"
                />
              </Form.Item>

              <Form.Item
                name="email"
                label={t("login.email")}
                rules={[
                  { required: true, message: t("common.required") },
                  { type: "email", message: t("login.email") },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder={t("login.emailPlaceholder")}
                  className="custom-input"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={t("login.newPassword")}
                rules={[{ required: true, message: t("common.required") }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder={t("login.newPasswordPlaceholder")}
                  className="custom-input"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                label={t("login.confirmPassword")}
                rules={[{ required: true, message: t("common.required") }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder={t("login.confirmPasswordPlaceholder")}
                  className="custom-input"
                  autoComplete="new-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  className="submit-button"
                >
                  {t("login.resetSubmit")}
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className="forgot-password">
            {mode === "login" ? (
              <a
                href="#"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  setMode("reset");
                }}
              >
                {t("login.forgot")}
              </a>
            ) : (
              <a
                href="#"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  resetForm.resetFields();
                  setMode("login");
                }}
              >
                {t("login.backToLogin")}
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}