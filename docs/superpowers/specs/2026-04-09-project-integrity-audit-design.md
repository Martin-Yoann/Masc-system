## 背景与目标

本仓库为 Next.js App Router 的管理后台（Next 16 + React 19 + antd），目前存在“可运行/可构建（A）”与“功能闭环（B）”层面的完整性问题：

- **路由/导航死链**：代码中存在 `/admin/profile`、`/admin/dashboard`、`/settings` 等跳转目标，但实际路由仅有顶层 `/{login,orders,products,profile,staff,users}` 与 `/`。
- **布局与页面耦合**：后台页面需要手动包裹 `AdminLayout`，容易漏包裹、样式/鉴权/菜单逻辑难统一。
- **构建与类型隐患**：`app/layout.tsx` 使用 `React.ReactNode` 但未显式引入类型；`globals.css` 未被引入可能导致全局样式缺失；`next-env.d.ts` 缺失；Tailwind v4 依赖已引入但缺少 `tailwind.config.`*。
- **登录跳转完整性**：`/login` 从查询参数 `next` 直接 `router.replace(next)`，未约束站内路径，可能造成异常跳转/循环。

目标（A+B）：

- **A 能跑/能部署**：`npm run build` 通过；关键类型错误消除；全局样式加载稳定；依赖安装可复现（已存在 `package-lock.json`）。
- **B 功能闭环**：登录→进入后台→菜单无死链→退出→回登录；提供 `not-found`/`error` 等基础边界页面。

## 方案选择：方案二（结构标准化）

采用 **Route Group** 将后台与登录隔离：

- `app/(admin)/layout.tsx`：后台统一 layout（内部使用现有 `AdminLayout`，或直接把 `AdminLayout` 逻辑内聚进该 layout）。
- `app/(admin)/page.tsx` 等后台页面：不再手动包裹 `AdminLayout`，只输出页面内容。
- `app/login/page.tsx`：保持在组外，不使用后台 layout。

该方案的收益：

- 页面结构一致，减少重复包装与漏包装风险。
- 后台导航、主题/语言切换、用户菜单等逻辑集中到后台 layout 统一维护。
- 后续扩展（增加后台子路由、loading/error 边界）更自然。

## 路由结构设计

### 现状

当前存在路由：

- `/`（Dashboard）`app/page.tsx`
- `/login` `app/login/page.tsx`
- `/orders` `app/orders/page.tsx`
- `/products` `app/products/page.tsx`
- `/profile` `app/profile/page.tsx`
- `/staff` `app/staff/page.tsx`
- `/users` `app/users/page.tsx`

### 目标结构（保持 URL 不变，仅调整目录归属）

通过 route group `(admin)` **不改变 URL**，只改变目录组织与 layout 复用：

- `app/(admin)/layout.tsx`：后台统一 layout
- `app/(admin)/page.tsx`：Dashboard（原 `/`）
- `app/(admin)/orders/page.tsx`：原 `/orders`
- `app/(admin)/products/page.tsx`：原 `/products`
- `app/(admin)/profile/page.tsx`：原 `/profile`
- `app/(admin)/staff/page.tsx`：原 `/staff`
- `app/(admin)/users/page.tsx`：原 `/users`

说明：

- `(admin)` 为 route group，不出现在 URL 中，因此仍保持现有 URL 兼容。
- `AdminLayout` 将作为 `(admin)` layout 的主体（以保证 UI 一致性）。

## 导航与跳转规则

需要修正的死链：

- `AdminLayout.tsx` 用户菜单：`router.push("/admin/profile")` → **改为** `router.push("/profile")`
- `AdminLayout.tsx` 账号设置：`router.push("/settings")` → **暂定改为** `router.push("/profile")`（或新增 `/settings` 路由；本轮以闭环优先，先不引入新功能页）
- `app/components/LoginPage.tsx`（如仍被引用）中的 `router.push("/admin/dashboard")` → **改为** `router.push("/")`（不过当前 `app/login/page.tsx` 实际使用的是 `AuthPage`）

登录 `next` 参数校验：

- 仅允许站内相对路径（以 `/` 开头，且不以 `//` 开头）
- 禁止跳回 `/login`（避免循环），非法时回退到 `/`

## 构建/样式/类型完整性（A）

### Root layout

`app/layout.tsx`：

- 引入 `./globals.css`，确保 Tailwind/global 样式生效
- `children` 类型改为 `ReactNode` 显式导入（`import type { ReactNode } from "react"`），避免 `Cannot find namespace 'React'` 类问题

### Next types

新增 `next-env.d.ts`（Next 标准文件），与 `tsconfig.json` 的 include 对齐。

### Tailwind 策略

当前 `globals.css` 使用 `@import "tailwindcss";` 且 `postcss.config.mjs` 已接入 `@tailwindcss/postcss`，但缺少 `tailwind.config.`*。

本方案采取 **补齐 Tailwind 配置**（不在本轮移除 Tailwind），以避免生产环境 class 扫描不完整：

- 新增 `tailwind.config.ts`（或 `.js`），`content` 覆盖 `app/**/*.{ts,tsx}` 与可能的组件目录
- 保持 Tailwind v4 的使用方式与 PostCSS 插件一致

## 功能闭环与基础边界（B）

新增基础页面：

- `app/not-found.tsx`：统一 404 页面，引导回首页或登录
- `app/error.tsx`：基本错误边界（可用 antd 组件）

（可选但本轮不强制）

- `(admin)/loading.tsx`：后台页面加载占位

## 风险与回滚策略

主要风险是“文件移动导致 import 路径变化”：

- 统一将页面对 `AdminLayout` 的引用移除（由 `(admin)/layout.tsx` 提供）
- 页面内部对 `../components/...` 的相对路径可能需要调整或改为 `@/app/components/...`

回滚策略：

- 若 route group 调整导致路径混乱，可先回滚到方案一的“最小修复”，保持页面目录不动，仅修导航死链与构建问题。

## 验收标准（Definition of Done）

- `npm run build` 成功
- `npm run lint` 成功（或至少输出可控、无致命错误）
- 访问 `/login` 登录成功后进入 `/`；菜单点击 `/users`、`/products`、`/orders`、`/staff`、`/profile` 均可达
- 头像菜单：个人中心/账号设置不再指向不存在路由；退出后回到 `/login`
- 访问不存在路径出现 `not-found` 页面

