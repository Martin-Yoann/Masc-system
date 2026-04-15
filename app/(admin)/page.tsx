"use client";

import { Alert, Card, Col, Row, Skeleton, Statistic } from "antd";
import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/app/I18nProvider";

type DashboardData = {
  orders_today: number;
  revenue_today: number;
  new_users_today: number;
  order_source: Array<{ name: string; value: number }>;
  trend: { x_axis: string[]; users: number[]; orders: number[] };
};

export default function Dashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch("/api/dashboard", { method: "GET", credentials: "include" })
      .then(async (res) => {
        const payload = await res.json();
        if (!res.ok) {
          const msg =
            payload && typeof payload === "object" && "message" in payload
              ? String((payload as { message: unknown }).message)
              : t("common.loadingFailed");
          throw new ApiError(msg, { status: res.status, payload });
        }
        return payload as DashboardData;
      })
      .then((payload) => {
        if (!mounted) return;
        setData(payload);
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

  const { ordersToday, revenueToday, newUsersToday, orderSourceData, lineXAxis, usersTrend, ordersTrend } =
    useMemo(() => {
      return {
        ordersToday: data?.orders_today ?? 0,
        revenueToday: data?.revenue_today ?? 0,
        newUsersToday: data?.new_users_today ?? 0,
        orderSourceData: data?.order_source ?? [],
        lineXAxis: data?.trend?.x_axis ?? [],
        usersTrend: data?.trend?.users ?? [],
        ordersTrend: data?.trend?.orders ?? [],
      };
    }, [data]);

  const pieOption = {
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        name: "Order source",
        type: "pie",
        radius: "65%",
        data: orderSourceData.length ? orderSourceData : [{ value: 1, name: "No Data" }],
      },
    ],
  };

  const lineOption = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: lineXAxis },
    yAxis: { type: "value" },
    series: [
      { name: "Users", data: usersTrend, type: "line", smooth: true },
      { name: "Orders", data: ordersTrend, type: "line", smooth: true },
    ],
  };

  return (
    <>
      {error ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} /> : null}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="Orders today">
            {loading ? <Skeleton.Input active block /> : <Statistic value={ordersToday} />}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Revenue today">
            {loading ? (
              <Skeleton.Input active block />
            ) : (
              <Statistic precision={2} prefix="$" value={revenueToday} />
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="New users">
            {loading ? <Skeleton.Input active block /> : <Statistic value={newUsersToday} />}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Order source">
            {loading ? (
              <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
              <ReactECharts option={pieOption} style={{ height: 300 }} />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Users / Orders">
            {loading ? (
              <Skeleton active paragraph={{ rows: 10 }} />
            ) : (
              <ReactECharts option={lineOption} style={{ height: 300 }} />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
