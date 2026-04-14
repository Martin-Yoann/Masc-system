"use client";

import { Alert, Card, Col, Row, Skeleton, Statistic } from "antd";
import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  bOrdersList,
  bUsersList,
  type BOrderListItem,
  type BUser,
} from "@/lib/api";
import { useI18n } from "@/app/I18nProvider";

const ORDER_PAGE_SIZE = 100;
const USER_PAGE_SIZE = 100;
const MAX_PAGES = 20;

function dayKey(dateLike: string | null | undefined) {
  if (!dateLike) return "";
  const d = new Date(dateLike.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfTodayKey() {
  return dayKey(new Date().toISOString());
}

async function fetchAllOrders() {
  const first = await bOrdersList({ page: 1, per_page: ORDER_PAGE_SIZE });
  let list = first.data.list;
  const lastPage = Math.min(first.data.pagination.last_page, MAX_PAGES);
  if (lastPage <= 1) return list;

  const rest = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, idx) =>
      bOrdersList({ page: idx + 2, per_page: ORDER_PAGE_SIZE }),
    ),
  );
  for (const page of rest) list = list.concat(page.data.list);
  return list;
}

async function fetchAllUsers() {
  const first = await bUsersList({ page: 1, page_size: USER_PAGE_SIZE });
  let list = first.data.list;
  const lastPage = Math.min(first.data.pagination.last_page, MAX_PAGES);
  if (lastPage <= 1) return list;

  const rest = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, idx) =>
      bUsersList({ page: idx + 2, page_size: USER_PAGE_SIZE }),
    ),
  );
  for (const page of rest) list = list.concat(page.data.list);
  return list;
}

export default function Dashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<BOrderListItem[]>([]);
  const [users, setUsers] = useState<BUser[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchAllOrders(), fetchAllUsers()])
      .then(([orderRows, userRows]) => {
        if (!mounted) return;
        setOrders(orderRows);
        setUsers(userRows);
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

  const {
    ordersToday,
    revenueToday,
    newUsersToday,
    orderSourceData,
    lineXAxis,
    usersTrend,
    ordersTrend,
  } = useMemo(() => {
    const today = startOfTodayKey();
    const todayOrders = orders.filter((o) => dayKey(o.created_at) === today);
    const ordersTodayCount = todayOrders.length;
    const todayRevenue = orders
      .filter((o) => dayKey(o.paid_at ?? o.created_at) === today && o.status === "paid")
      .reduce((sum, o) => sum + Number(o.price || 0), 0);
    const newUsers = users.filter((u) => dayKey(u.created_at) === today).length;

    const sourceMap = new Map<string, number>();
    for (const order of orders) {
      const source = order.product?.key || order.product?.name || "Other";
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    }
    const sourceData = Array.from(sourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const dayKeys: string[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayKeys.push(dayKey(d.toISOString()));
    }
    const userCountMap = new Map(dayKeys.map((k) => [k, 0]));
    for (const u of users) {
      const k = dayKey(u.created_at);
      if (userCountMap.has(k)) userCountMap.set(k, (userCountMap.get(k) || 0) + 1);
    }
    const orderCountMap = new Map(dayKeys.map((k) => [k, 0]));
    for (const o of orders) {
      const k = dayKey(o.created_at);
      if (orderCountMap.has(k)) orderCountMap.set(k, (orderCountMap.get(k) || 0) + 1);
    }

    return {
      ordersToday: ordersTodayCount,
      revenueToday: todayRevenue,
      newUsersToday: newUsers,
      orderSourceData: sourceData,
      lineXAxis: dayKeys.map((k) => k.slice(5)),
      usersTrend: dayKeys.map((k) => userCountMap.get(k) || 0),
      ordersTrend: dayKeys.map((k) => orderCountMap.get(k) || 0),
    };
  }, [orders, users]);

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
