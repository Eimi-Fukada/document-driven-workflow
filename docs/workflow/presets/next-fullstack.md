# Stack Preset: next-fullstack

## 适用场景

- Web 全栈产品
- SaaS
- 管理后台
- 官网和 SEO 页面
- 工具类应用

## 固定技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma 或 Drizzle，项目级 ADR 固定其一
- Vitest 或 Jest，项目级 ADR 固定其一
- Playwright
- Vercel

## 强制规则

- 只允许 App Router。
- 禁止 Pages Router。
- 路由、服务端逻辑和 API 必须贴合 App Router 结构。
- 页面、布局和 API 必须使用 `app/` 目录模型；不要新增 `pages/`、`getServerSideProps`、`getStaticProps` 或 Pages Router API。
- 默认优先使用 Server Components；只有交互状态、浏览器 API、事件处理、客户端缓存或动画确实需要时，才使用 Client Components。
- Client Component 边界应尽量小，不要把整页因为局部交互整体改成 `"use client"`。
- 服务端数据读取、权限校验和敏感逻辑优先放在 Server Component、Route Handler、Server Action 或服务层中，不要下沉到客户端。
- 表单和 API 入参必须有 schema 校验，推荐 Zod 或项目既有等价方案。
- 数据库访问应集中在服务层、repository 或项目既有数据访问层，不要在 UI 组件里散落查询逻辑。
- 长列表、大表格、频繁轮询、大文件、音视频或图片处理必须写明分页、缓存、虚拟滚动、流式处理或异步化方案。
- UI 样式优先使用 Tailwind CSS utility classes，并遵守项目既有 shadcn/ui 组件组合方式。
- 只有在项目既有约定、第三方库集成、全局样式、复杂动画或 Tailwind 难以清楚表达时，才新增单独 CSS，并在实现计划和验证报告中写明原因。
- 可复用 UI 优先抽成 component；可复用状态逻辑优先抽成 hook；可复用服务端逻辑优先抽成 service/helper。
- SEO 页面应优先使用 Metadata API、语义化 HTML 和服务端可渲染内容，不要把核心 SEO 内容完全放到客户端渲染。
- 环境变量、密钥、支付、认证、权限和会员逻辑不得暴露到客户端，除非它们本来就是 public 配置。
- 关键用户路径必须有 Playwright 或冒烟测试。

## 推荐目录边界

- `app/`：路由、布局、页面、Route Handler、Server Action 入口。
- `components/`：可复用 UI 组件。
- `features/`：按业务能力组织的组件、hooks、服务和局部状态。
- `lib/`：通用工具、配置、客户端封装和跨功能 helper。
- `server/` 或项目既有服务层：数据库、权限、外部服务、核心业务逻辑。
- `tests/` 或 `e2e/`：单元、集成、Playwright 和冒烟测试。

目录命名应优先跟随目标项目既有约定；新项目才按以上边界初始化。

## 默认验证命令

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```
