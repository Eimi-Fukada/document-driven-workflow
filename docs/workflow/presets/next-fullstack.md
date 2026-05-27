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

## 前端状态与副作用规则

- 不要用无限增长的 `useState`、多层相互派生 state 或难以追踪的全局状态来堆功能。
- 能从 props、URL search params、服务端数据或已有状态推导出的值，不要再存一份 state。
- 表单状态、筛选条件、分页、弹窗、选中项等局部交互优先放在局部组件或局部 hook；只有跨页面、跨模块或需要持久化时才进入全局 store。
- `useEffect` 只用于同步外部系统、订阅、浏览器 API、计时器或第三方组件；不要用 `useEffect` 做普通数据派生或补丁式业务流程。
- `useEffect`、`useMemo`、`useCallback` 的依赖必须完整；如果依赖会导致循环，先重构数据流、稳定引用或移除不必要 effect，不要通过删依赖绕过 lint。
- 禁止在 effect 中无条件 `setState` 并把该 state 或每次 render 都变化的对象、数组、函数放进依赖，避免无限循环。
- 高频输入、滚动、拖拽、轮询和大列表更新必须考虑 debounce、throttle、虚拟滚动、分页或服务端筛选。
- Client Component 里不要一次性持有大型数据集；大数据列表、任务列表、日志、表格和搜索结果应分页、增量加载或虚拟化。

## 推荐库与适用边界

这些库是 `next-fullstack` 的主流候选，不代表所有项目都必须安装。优先遵守目标项目已有选择；新增依赖必须写明用途、替代方案和维护成本。

- 客户端 UI 状态：推荐候选 `zustand`。适合跨组件 UI 状态、任务面板状态、筛选器、播放器状态、向导步骤、局部持久化偏好。不要用它替代服务端数据缓存、权限校验、数据库状态或业务真相源。
- Zustand 持久化：可使用 `persist` middleware 保存低敏偏好和可恢复 UI 状态，例如布局、筛选条件、草稿、任务面板展开状态。不要持久化 token、权限、会员权益、价格、支付状态、敏感个人信息或必须以服务端为准的数据。持久化字段应使用 partialize 或等价方式白名单化。
- 服务端状态缓存：推荐候选 `@tanstack/react-query`。适合客户端需要缓存、重试、分页、无限滚动、轮询、乐观更新或失效刷新的 server state。不要在 Server Component 直接读取场景里为了“统一”强行引入。
- 表单：简单 Server Action 表单优先使用 Next / React 内建能力；复杂客户端表单推荐候选 `react-hook-form` + `zod` 或项目既有 schema 方案。服务端仍必须重新校验，不要只依赖客户端校验。
- API/schema：推荐候选 `zod`。用于表单、Route Handler、Server Action、环境变量和外部 API payload 校验。schema 应靠近业务边界复用，避免每个组件各写一份。
- 大表格/虚拟列表：推荐候选 `@tanstack/react-table`、`@tanstack/react-virtual` 或项目既有表格方案。长列表不应靠一次性渲染全部 DOM 解决。
- 数据库访问：Prisma 或 Drizzle 二选一，由项目级 ADR 固定；不要同一项目混用多个 ORM，除非 legacy 兼容文档明确允许。
- 日期、金额、国际化、图表、编辑器、上传、播放器等重型能力，优先选择项目已有库；新增库必须说明 bundle 影响和懒加载策略。

库选择判断：

- React local state 足够时，不引入全局 store。
- Server Component 直接读取足够时，不引入客户端 server-state 缓存。
- URL search params 能表达筛选、分页和分享状态时，不额外持久化。
- 只有跨组件、跨路由、需要恢复或需要复杂交互协调时，才考虑 Zustand。
- 只有客户端确实需要缓存、重试、轮询、乐观更新或失效刷新时，才考虑 TanStack Query。

## 后端与数据访问规则

- 每个涉及数据库的 Feature 必须写明数据规模假设，例如行数、分页大小、并发量、频率或任务量。
- 禁止在请求路径里执行无边界大查询；列表接口必须有分页、排序边界和最大 limit。
- 禁止容易放大 CPU/IO 的 N+1 查询、未限制子查询、未索引过滤、全表扫描式搜索和无边界聚合；如确实需要，必须记录索引、缓存、离线计算或异步化方案。
- Prisma / Drizzle 查询应只选择需要的字段，避免把大对象、长文本、二进制、日志或无关关联一次性返回给前端。
- 写操作必须考虑事务边界、幂等性、权限校验和错误返回；不要把部分成功伪装成成功。
- 重计算、批处理、导入导出、音视频处理、压缩打包和第三方轮询应优先考虑队列、后台任务、流式响应、缓存或限流。
- 用户相关、权限相关和实时性强的数据必须明确缓存策略；不要让静态缓存、Router Cache 或 Data Cache 返回过期的用户状态。
- Server Component 中读取数据时，优先直接调用服务层函数；不要为了内部数据读取绕一层 Route Handler。

## 可维护实现实践

- 页面文件应保持薄层，只负责组合布局、读取路由参数和调用 feature/service；复杂 UI 拆到 `components/` 或 `features/`。
- 业务规则、权限判断、价格/额度/会员权益、任务状态流转不要散落在多个组件中，应集中到 service、domain helper 或项目既有业务层。
- 重复出现 2 次以上的 UI 结构、请求封装、状态逻辑、schema 校验或数据映射，应考虑抽成 component、hook、helper、schema 或 service。
- 不要为了“少改文件”把多个无关职责塞进一个组件、hook、Route Handler 或 Server Action。
- 错误处理应区分用户可见错误、权限错误、校验错误、外部服务错误和未知错误；不要只 `console.error` 后吞掉。
- Loading、empty、error、disabled、permission denied 和 optimistic update 回滚状态应作为交互闭环的一部分。
- 新增依赖必须有明确用途；优先使用项目已有库和 Next/React 内建能力，避免为小功能引入重量级状态库、请求库或 UI 库。

## 渲染、缓存和错误边界

- 涉及数据读取的页面必须说明渲染策略：static、dynamic、ISR、streaming 或 per-request。
- 用户态、权限态、会员态、价格、额度、任务状态等数据默认按请求读取或明确 revalidate，不要误用静态缓存。
- 数据变更后必须说明刷新策略：`revalidatePath`、`revalidateTag`、client invalidation、`router.refresh()` 或项目既有方案。
- 慢数据页面应考虑 `loading.tsx`、Suspense 或局部 skeleton。
- 路由级错误应考虑 `error.tsx`；不存在资源应使用 `notFound()` / `not-found.tsx` 或项目既有 404 方案。
- 不要把所有异常都吞成 toast、`console.error` 或空状态；用户可见错误、权限错误、校验错误和未知错误要分开处理。

## 表单、变更和权限边界

- Server Action 和 Route Handler 都视为公开入口，必须做鉴权、授权和入参校验。
- 不能只靠隐藏按钮、前端路由守卫或 layout return null 保护权限。
- 表单提交必须有 pending、disabled、错误展示和成功/失败闭环。
- 乐观更新必须有失败回滚和缓存失效策略。
- 支付、权限、会员、额度、任务状态、用户资料和数据删除类变更默认需要测试或明确验证证据。

## Bundle 与客户端 JS 控制

- 新增大型依赖、图表、编辑器、播放器、拖拽、富文本、地图、表格等能力时，必须说明是否懒加载或动态加载。
- 不要把 ORM、Node-only SDK、密钥相关 SDK、服务端文件处理库引入 Client Component。
- 能在 Server Component 完成的渲染和数据准备，不要搬到客户端只为了复用 hook。
- 明显增加客户端 JS 的改动，应记录 bundle 风险或运行 `analyze` / 项目既有体积检查。

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
