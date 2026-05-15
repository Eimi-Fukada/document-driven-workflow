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
- 关键用户路径必须有 Playwright 或冒烟测试。

## 默认验证命令

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```
