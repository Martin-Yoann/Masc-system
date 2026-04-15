import { NextResponse, type NextRequest } from "next/server";

type DashboardResponse = {
  orders_today: number;
  revenue_today: number;
  new_users_today: number;
  order_source: Array<{ name: string; value: number }>;
  trend: {
    x_axis: string[]; // MM-DD
    users: number[];
    orders: number[];
  };
};

const MAX_PAGES = 20;
const ORDER_PAGE_SIZE = 100;
const USER_PAGE_SIZE = 100;

function dayKey(dateLike: string | null | undefined) {
  if (!dateLike) return "";
  const d = new Date(dateLike.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey() {
  return dayKey(new Date().toISOString());
}

function backendBase() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://43.135.134.131"
  ).replace(/\/+$/, "");
}

async function fetchJson<T>(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
}

export async function GET(req: NextRequest) {
  const base = backendBase();
  const cookie = req.headers.get("cookie") || "";

  type OrdersEnvelope = {
    code: number;
    message: string;
    data: {
      data: Array<{
        order_no: string;
        product?: { key?: string; name?: string };
        price: number;
        status: string;
        paid_at: string | null;
        created_at: string;
      }>;
      meta: { current_page: number; last_page: number; per_page: number; total: number };
    };
  };

  type UsersEnvelope = {
    code: number;
    message: string;
    data: {
      list: Array<{ id: number; created_at: string }>;
      pagination: { current_page: number; last_page: number; per_page: number; total: number };
    };
  };

  const commonInit: RequestInit = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      cookie,
    },
    cache: "no-store",
  };

  // Orders (paginated)
  const firstOrders = await fetchJson<OrdersEnvelope>(
    `${base}/api/b/orders?page=1&per_page=${ORDER_PAGE_SIZE}`,
    commonInit,
  );
  let orders = firstOrders.data.data;
  const ordersLast = Math.min(firstOrders.data.meta.last_page, MAX_PAGES);
  if (ordersLast > 1) {
    const rest = await Promise.all(
      Array.from({ length: ordersLast - 1 }, (_, idx) =>
        fetchJson<OrdersEnvelope>(
          `${base}/api/b/orders?page=${idx + 2}&per_page=${ORDER_PAGE_SIZE}`,
          commonInit,
        ),
      ),
    );
    for (const page of rest) orders = orders.concat(page.data.data);
  }

  // Users (paginated)
  const firstUsers = await fetchJson<UsersEnvelope>(
    `${base}/api/b/users?page=1&page_size=${USER_PAGE_SIZE}`,
    commonInit,
  );
  let users = firstUsers.data.list;
  const usersLast = Math.min(firstUsers.data.pagination.last_page, MAX_PAGES);
  if (usersLast > 1) {
    const rest = await Promise.all(
      Array.from({ length: usersLast - 1 }, (_, idx) =>
        fetchJson<UsersEnvelope>(
          `${base}/api/b/users?page=${idx + 2}&page_size=${USER_PAGE_SIZE}`,
          commonInit,
        ),
      ),
    );
    for (const page of rest) users = users.concat(page.data.list);
  }

  const today = todayKey();
  const ordersToday = orders.filter((o) => dayKey(o.created_at) === today).length;
  const revenueToday = orders
    .filter((o) => dayKey(o.paid_at ?? o.created_at) === today && o.status === "paid")
    .reduce((sum, o) => sum + Number(o.price || 0), 0);
  const newUsersToday = users.filter((u) => dayKey(u.created_at) === today).length;

  const sourceMap = new Map<string, number>();
  for (const o of orders) {
    const source = o.product?.key || o.product?.name || "Other";
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
  }
  const orderSource = Array.from(sourceMap.entries())
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

  const payload: DashboardResponse = {
    orders_today: ordersToday,
    revenue_today: revenueToday,
    new_users_today: newUsersToday,
    order_source: orderSource,
    trend: {
      x_axis: dayKeys.map((k) => k.slice(5)),
      users: dayKeys.map((k) => userCountMap.get(k) || 0),
      orders: dayKeys.map((k) => orderCountMap.get(k) || 0),
    },
  };

  return NextResponse.json(payload);
}

