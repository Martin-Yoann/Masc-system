"use client";

import { Layout, Menu, Avatar, Dropdown, Space, Switch, Tooltip, Button, type MenuProps } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  OrderedListOutlined,
  LogoutOutlined,
  SettingOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { bAdminLogout, bAdminMe, type BAdmin } from "@/lib/api";
import { useI18n } from "@/app/I18nProvider";
import { adminAvatarDataUri } from "@/lib/adminAvatar";

const { Header, Sider, Content } = Layout;
const ADMIN_PROFILE_UPDATED_EVENT = "admin:profile-updated";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [darkMode, setDarkMode] = useState(true);
  const [me, setMe] = useState<BAdmin | null>(null);
  const { lang, setLang, t } = useI18n();

  const loadMe = useCallback(async () => {
    try {
      const res = await bAdminMe();
      setMe(res.data);
    } catch {
      // middleware already protects, but keep UI resilient
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useEffect(() => {
    const handler = () => {
      void loadMe();
    };
    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, handler);
    return () => window.removeEventListener(ADMIN_PROFILE_UPDATED_EVENT, handler);
  }, [loadMe]);

  const doLogout = async () => {
    try {
      await bAdminLogout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: t("nav.dashboard"),
    },
    {
      key: "/users",
      icon: <UserOutlined />,
      label: t("nav.users"),
    },
    {
      key: "/products",
      icon: <ShoppingOutlined />,
      label: t("nav.products"),
    },
    {
      key: "/orders",
      icon: <OrderedListOutlined />,
      label: t("nav.orders"),
    },
    { key: "/staff", icon: <UserOutlined />, label: t("nav.staff") },
  ];

  const userMenu: MenuProps["items"] = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: t("nav.settings"),
      onClick: () => router.push("/settings"),
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("nav.logout"),
      onClick: doLogout,
    },
  ];

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      {/* 左侧菜单 */}
      <Sider
        theme={darkMode ? "dark" : "light"}
        style={{ height: "100vh", overflow: "hidden" }}
      >
        <div
          style={{
            color: darkMode ? "#fff" : "#000",
            padding: 16,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {t("app.brand")}
        </div>

        <div style={{ height: "calc(100vh - 220px)", overflowY: "auto" }}>
          <Menu
            theme={darkMode ? "dark" : "light"}
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={(e) => router.push(e.key)}
          />
        </div>

        {/* Sidebar 底部工具 */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            padding: "0 16px",
            color: darkMode ? "#fff" : "#000",
          }}
        >
          <Space orientation="vertical" style={{ width: "100%" }}>
            {/* 语言切换 */}
            <Space>
              <GlobalOutlined />
              <span style={{ display: "inline-block", minWidth: 88 }}>
                {t("nav.language")}
              </span>
              <Switch
                checked={lang === "en"}
                onChange={(v) => setLang(v ? "en" : "zh")}
                checkedChildren="EN"
                unCheckedChildren="中"
              />
            </Space>
          </Space>
        </div>
      </Sider>

      <Layout style={{ height: "100vh", overflow: "hidden" }}>
        {/* 顶部导航 */}
        <Header
          style={{
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingInline: 24,
            borderBottom: "1px solid #f0f0f0",
            flex: "0 0 auto",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 500 }}>{t("app.system")}</div>

          <Space size={12}>
            <Tooltip title={darkMode ? "Dark mode" : "Light mode"}>
              <Button
                type="text"
                aria-label="Toggle theme"
                icon={darkMode ? <MoonOutlined /> : <SunOutlined />}
                onClick={() => setDarkMode((v) => !v)}
              />
            </Tooltip>

            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <Space style={{ cursor: "pointer" }}>
                {me?.is_super ? (
                  <Avatar src={adminAvatarDataUri({ text: "MASC", size: 96 })} />
                ) : (
                  <Avatar icon={<UserOutlined />} />
                )}
                {me?.name || "Admin"}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容 */}
        <Content
          style={{
            padding: 24,
            background: "#f5f6fa",
            display: "flex",
            flexDirection: "column",
            overflowY: pathname.startsWith("/users") ? "hidden" : "auto",
            flex: 1,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}