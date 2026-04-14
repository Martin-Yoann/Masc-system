"use client";

import Link from "next/link";
import { useI18n } from "@/app/I18nProvider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>{t("notFound.title")}</h1>
      <p style={{ marginBottom: 24, color: "#666" }}>{t("notFound.subtitle")}</p>
      <Link href="/" style={{ color: "#1677ff" }}>
        {t("notFound.home")}
      </Link>
    </div>
  );
}
