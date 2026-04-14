# Masc System Admin Console

基于 `Next.js 16 + React 19 + Ant Design` 的后台管理系统，支持管理员登录、用户管理、订单管理、仪表盘统计、账户设置与中英双语切换。

## 功能概览

- 登录与会话
  - 管理员登录、退出登录
  - 页面级鉴权（未登录自动跳转登录页）
- 仪表盘
  - 今日订单数、今日收入、今日新增用户
  - `Order source` 饼图
  - `Users / Orders` 近 7 天趋势图
- 用户管理
  - 列表、分页、关键词查询
  - 用户详情页
- 管理员管理
  - 列表、分页、关键词查询
  - 新增 / 编辑 / 删除管理员
- 订单管理
  - 订单列表、分页、按 `order_no` 查询
  - 订单详情页
  - 标记已联系、标记已退款
- 账户设置
  - 修改用户名、邮箱、密码
  - 更新后顶部用户信息实时刷新
- 国际化
  - 中英文切换（`zh` / `en`）

## 技术栈

- `next@16.1.6` (App Router, Turbopack)
- `react@19.2.3` / `react-dom@19.2.3`
- `antd@6` + `@ant-design/icons`
- `echarts` + `echarts-for-react`
- `typescript` + `eslint`

## 目录结构

```text
app/
  (admin)/
    page.tsx                 # 仪表盘
    users/                   # 用户模块
    admins/                  # 管理员模块
    orders/                  # 订单模块（含详情）
    settings/                # 账户设置
  components/
    AdminLayout.tsx          # 后台布局（侧边栏/顶部用户）
    AuthPage.tsx             # 登录/重置入口组件
  login/page.tsx             # 登录页
  I18nProvider.tsx           # i18n 上下文
  AntdRegistry.tsx           # antd SSR 注册
lib/
  api.ts                     # API 封装与类型定义
  i18n.ts                    # 文案字典
  api.test.ts                # API path 构建测试
proxy.ts                     # 页面访问鉴权代理
next.config.ts               # /api/* 转发到后端
```

## 环境要求

- Node.js `>= 20`（推荐 LTS）
- npm `>= 9`

## 环境变量

项目默认后端地址为 `http://43.135.134.131`。如需覆盖，请在项目根目录创建 `.env.local`：

```bash
API_BASE_URL=http://43.135.134.131
NEXT_PUBLIC_API_BASE_URL=http://43.135.134.131
```

说明：
- 前端业务请求使用同源 `/api/*`，由 `next.config.ts` rewrite 转发到后端。
- 这样可以避免浏览器跨域与 Cookie 凭据问题。

## 本地开发

```bash
npm install
npm run dev
```

启动后访问：
- [http://localhost:3000](http://localhost:3000)

## 常用脚本

```bash
npm run dev      # 本地开发
npm run build    # 构建生产包
npm run start    # 启动生产服务
npm run lint     # 代码检查
npm run test     # 运行 API path 单测
```

## 部署到 Vercel

### 方式一：Git 集成（推荐）

1. 将代码推送到 GitHub 仓库（如 `main` 分支）
2. 打开 [Vercel](https://vercel.com/) 导入该仓库
3. 在 Vercel 项目环境变量中配置：
   - `API_BASE_URL`
   - `NEXT_PUBLIC_API_BASE_URL`
4. 执行部署

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 鉴权与代理说明

- `proxy.ts` 会拦截受保护页面，调用后端 `/api/b/auth/me` 检测会话状态。
- 未登录访问后台页面会自动跳转 `/login`。
- `/api/*` 请求通过 Next 转发到后端服务，前端无需直接请求远程域名。

## 常见问题

- `webpack-hmr` WebSocket 报错：
  - 这是本地开发热更新通道，不是业务 API。
  - 通常是 `npm run dev` 未启动、代理/VPN 干扰或页面未从本地地址访问导致。
- 更新账户设置后顶部名称不刷新：
  - 已通过事件机制同步刷新（`admin:profile-updated`）。

## License

内部项目，按团队规范使用。
