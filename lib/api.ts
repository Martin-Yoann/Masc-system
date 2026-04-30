export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
};

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://43.135.134.131"
  );
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, opts: { status: number; payload: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.payload = opts.payload;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { isB?: boolean } = {},
): Promise<ApiEnvelope<T>> {
  // B 端（Session）请求优先走同源 `/api/*`，让 Next 代理到后端，避免浏览器 CORS + credentials 冲突。
  const url = init.isB
    ? `${path.startsWith("/") ? "" : "/"}${path}`
    : (() => {
        const baseUrl = getBaseUrl().replace(/\/+$/, "");
        return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
      })();

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: init.isB ? "include" : init.credentials,
  });

  const payload = await readJsonSafe(res);
  if (!res.ok) {
    const msg =
      (payload &&
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload
        ? String((payload as { message: unknown }).message)
        : undefined) || `Request failed (${res.status})`;
    throw new ApiError(msg, { status: res.status, payload });
  }

  return payload as ApiEnvelope<T>;
}

export type BAdmin = {
  id: number;
  name: string;
  email: string;
  is_super: boolean;
};

export type BAdminListItem = BAdmin & {
  created_at: string;
};

export type BAdminDetail = BAdmin & {
  created_at: string;
  updated_at: string;
};

export type BAdminUpsertInput = {
  name: string;
  email: string;
  password: string;
  is_super: boolean;
};

export type BUser = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
};

export type BUserDetail = BUser & {
  updated_at: string;
};

export type BPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type BUserListData = {
  list: BUser[];
  pagination: BPagination;
};

export type BAdminListData = {
  list: BAdminListItem[];
  pagination: BPagination;
};

export type BOrderUser = {
  id: number;
  name: string;
  email: string;
};

export type BOrderProduct = {
  key: string;
  name: string;
  description?: string;
  price: number;
};

export type BOrderListItem = {
  order_no: string;
  user: BOrderUser;
  product: BOrderProduct;
  price: number;
  status: string;
  paid_at: string | null;
  contacted_at: string | null;
  refunded_at: string | null;
  created_at: string;
};

export type BOrderDetail = BOrderListItem & {
  currency: string;
  buyer_message: string | null;
  preferred_contact_time: string | null;
  contact_method: string | null;
  canceled_at: string | null;
  product: BOrderProduct & {
    description: string | null;
  };
};

type BOrdersListApiData = {
  data: BOrderListItem[];
  meta: BPagination;
};

export type BOrderListData = {
  list: BOrderListItem[];
  pagination: BPagination;
};

export async function bAdminLogin(input: {
  email: string;
  password: string;
}) {
  return apiFetch<BAdmin>("/api/b/auth/login", {
    method: "POST",
    isB: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function bAdminLogout() {
  return apiFetch<null>("/api/b/auth/logout", {
    method: "POST",
    isB: true,
  });
}

export async function bAdminMe() {
  return apiFetch<BAdmin>("/api/b/auth/me", { method: "GET", isB: true });
}

export function buildBUsersListPath(params: {
  keyword?: string;
  page?: number;
  page_size?: number;
}) {
  const keyword = params.keyword?.trim();
  const page = Number.isFinite(params.page) && (params.page ?? 0) > 0 ? params.page! : 1;
  const pageSize =
    Number.isFinite(params.page_size) && (params.page_size ?? 0) > 0
      ? params.page_size!
      : 15;

  const sp = new URLSearchParams();
  if (keyword) sp.set("keyword", keyword);
  sp.set("page", String(page));
  sp.set("page_size", String(pageSize));
  return `/api/b/users?${sp.toString()}`;
}

export async function bUsersList(params: {
  keyword?: string;
  page?: number;
  page_size?: number;
}) {
  return apiFetch<BUserListData>(buildBUsersListPath(params), {
    method: "GET",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export function buildBUserDetailPath(userId: number | string) {
  const id = String(userId).trim();
  return `/api/b/users/${encodeURIComponent(id)}`;
}

export async function bUserDetail(userId: number | string) {
  return apiFetch<BUserDetail>(buildBUserDetailPath(userId), {
    method: "GET",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export function buildBAdminsListPath(params: {
  keyword?: string;
  page?: number;
  page_size?: number;
}) {
  const keyword = params.keyword?.trim();
  const page = Number.isFinite(params.page) && (params.page ?? 0) > 0 ? params.page! : 1;
  const pageSize =
    Number.isFinite(params.page_size) && (params.page_size ?? 0) > 0
      ? params.page_size!
      : 15;

  const sp = new URLSearchParams();
  if (keyword) sp.set("keyword", keyword);
  sp.set("page", String(page));
  sp.set("page_size", String(pageSize));
  return `/api/b/admins?${sp.toString()}`;
}

export function buildBAdminDetailPath(adminId: number | string) {
  const id = String(adminId).trim();
  return `/api/b/admins/${encodeURIComponent(id)}`;
}

export async function bAdminsList(params: {
  keyword?: string;
  page?: number;
  page_size?: number;
}) {
  return apiFetch<BAdminListData>(buildBAdminsListPath(params), {
    method: "GET",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export async function bAdminDetail(adminId: number | string) {
  return apiFetch<BAdminDetail>(buildBAdminDetailPath(adminId), {
    method: "GET",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export async function bAdminCreate(input: BAdminUpsertInput) {
  return apiFetch<BAdmin>("/api/b/admins", {
    method: "POST",
    isB: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function bAdminUpdate(
  adminId: number | string,
  input: Partial<BAdminUpsertInput> & { name: string; email: string; is_super: boolean },
) {
  return apiFetch<BAdmin>(buildBAdminDetailPath(adminId), {
    method: "PUT",
    isB: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function bAdminDelete(adminId: number | string) {
  return apiFetch<null>(buildBAdminDetailPath(adminId), {
    method: "DELETE",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export function buildBOrdersListPath(params: {
  order_no?: string;
  page?: number;
  per_page?: number;
}) {
  const orderNo = params.order_no?.trim();
  const page = Number.isFinite(params.page) && (params.page ?? 0) > 0 ? params.page! : 1;
  const perPage =
    Number.isFinite(params.per_page) && (params.per_page ?? 0) > 0 ? params.per_page! : 16;

  const sp = new URLSearchParams();
  if (orderNo) sp.set("order_no", orderNo);
  sp.set("page", String(page));
  sp.set("per_page", String(perPage));
  return `/api/b/orders?${sp.toString()}`;
}

export async function bOrdersList(params: {
  order_no?: string;
  page?: number;
  per_page?: number;
}): Promise<ApiEnvelope<BOrderListData>> {
  const res = await apiFetch<BOrdersListApiData>(buildBOrdersListPath(params), {
    method: "GET",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });

  return {
    ...res,
    data: {
      list: res.data.data,
      pagination: res.data.meta,
    },
  };
}

export function buildBOrderDetailPath(orderId: number | string) {
  const id = String(orderId).trim();
  return `/api/b/orders/${encodeURIComponent(id)}`;
}

export async function bOrderDetail(orderId: number | string) {
  return apiFetch<BOrderDetail>(buildBOrderDetailPath(orderId), {
    method: "GET",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export async function bOrderRefund(orderId: number | string) {
  return apiFetch<null>(`${buildBOrderDetailPath(orderId)}/refund`, {
    method: "POST",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export async function bOrderContact(orderId: number | string) {
  return apiFetch<null>(`${buildBOrderDetailPath(orderId)}/contact`, {
    method: "POST",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export async function bOrderPay(orderId: number | string) {
  return apiFetch<null>(`${buildBOrderDetailPath(orderId)}/pay`, {
    method: "POST",
    isB: true,
    headers: { "Content-Type": "application/json" },
  });
}

export async function bOrderInvoice(
  orderId: number | string,
  input: { invoice_no: string; internal_note: string },
) {
  return apiFetch<null>(`${buildBOrderDetailPath(orderId)}/invoice`, {
    method: "POST",
    isB: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

