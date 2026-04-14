"use client";

import { Button, Result } from "antd";
import { useI18n } from "@/app/I18nProvider";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  return (
    <div style={{ padding: 48 }}>
      <Result
        status="error"
        title={t("error.title")}
        subTitle={error.message || t("common.loadingFailed")}
        extra={
          <Button type="primary" onClick={() => reset()}>
            {t("common.reset")}
          </Button>
        }
      />
    </div>
  );
}
