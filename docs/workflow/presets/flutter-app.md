# Stack Preset: flutter-app

## 适用场景

- iOS / Android App。
- Flutter 多端客户端。
- 需要中型项目可维护的客户端架构。
- 后端可以是 FastAPI、Express、Next.js API、Spring Boot、Go、第三方 SaaS 或其他服务；本 preset 不绑定后端框架。

## 固定技术栈

- Flutter stable
- Dart
- Riverpod
- go_router
- dio
- flutter_test
- integration_test

## 后端边界

Flutter 是客户端框架，本 preset 只约束 Flutter 客户端。目标项目的后端框架、数据库、部署方式和验证命令必须在 `03-technical-contract.md`、`06-implementation-plan.md` 和 `08-context-pack.md` 中按项目现状写清楚。

- Flutter 客户端不能绕过 API 契约直接依赖数据库。
- API 契约必须写清请求、响应、错误、鉴权和版本兼容边界。
- 后端性能风险由技术契约记录，例如分页、索引、大查询、批处理、并发写入、缓存和任务队列。
- 如果后端是 custom stack，本工作流不因为没有内置后端 preset 而阻断开发。

## Flutter 客户端架构

Flutter 客户端采用固定 Feature-first MVVM 骨架。目录骨架固定，未使用目录可以为空或只保留 `.gitkeep`，但不得绕过层边界。

```text
lib/
  app/
    router/
    theme/
    bootstrap/
  core/
    network/
    storage/
    error/
    widgets/
    utils/
  features/
    feature_name/
      presentation/
        pages/
        widgets/
        view_models/
      application/
        use_cases/
      domain/
        models/
        repositories/
      data/
        dto/
        mappers/
        repositories/
        services/
```

### 目录职责

- `presentation/pages`：页面入口，负责布局、组合组件、监听 ViewModel 状态和触发用户动作。
- `presentation/widgets`：当前 Feature 内部组件，包括骨架屏、空状态、错误状态、列表项、表单块等。
- `presentation/view_models`：ViewModel，负责页面状态、用户动作、loading/error/success 状态转换，并调用 Repository 或 Use Case。
- `application/use_cases`：复杂业务动作，不是测试用例。仅当动作跨多个 Repository、需要复用、需要独立测试、包含上传/支付/登录/任务状态/回滚/重试等流程时使用。
- `domain/models`：App 内部业务模型。
- `domain/repositories`：Repository 抽象，用于测试、缓存、多数据源或复杂业务边界。
- `data/dto`：API 请求和响应 DTO。
- `data/mappers`：DTO 和业务模型转换。仅当后端字段、枚举、时间、金额、状态码或嵌套结构与前端业务模型不一致时必须使用。
- `data/repositories`：Repository 实现，负责调用 Service、组合缓存或远程数据、转换 DTO，并向 ViewModel / Use Case 提供稳定数据能力。
- `data/services`：Dio API service、本地存储 service 或文件 service，只处理外部通信和技术细节。

## Flutter 强制规则

- View / Page 不允许直接调用 dio、API service、数据库或本地存储。
- ViewModel 可以承载轻量页面逻辑；当 ViewModel 明显膨胀、逻辑超过约 50-80 行、跨多个数据源或需要独立测试时，必须抽到 `application/use_cases`。
- 简单 Feature 可以不实现 Use Case，但仍保留目录骨架。
- Repository 是业务数据入口；页面和组件不得直接依赖 `data/services`。
- Riverpod 用于依赖注入和业务状态暴露，不把所有临时 UI 状态都提升为全局状态。
- 临时 UI 状态优先保留在 Widget 本地；跨页面、异步数据、业务状态才进入 Riverpod。
- 错误、加载、空数据和成功状态必须统一建模，避免每个页面自定义一套状态。
- 复用 2 次以上的组件、状态处理或业务逻辑应考虑抽取。
- 触碰的单文件尽量不超过 1000 lines；超过时必须说明拆分计划或例外原因。

## Flutter 用户体验规则

- 每个异步页面必须有 loading、error、empty、success 状态。
- 长加载页面优先使用骨架屏，不只使用全屏转圈。
- 错误状态必须有用户可理解的提示和重试入口。
- 空状态必须说明下一步动作，例如创建、刷新、返回或联系支持。
- 列表必须考虑分页、下拉刷新、加载更多和弱网失败恢复。
- 表单提交必须有 submitting / disabled 状态，避免重复提交。
- 长任务必须展示进度、阶段状态、轮询或后台恢复策略。
- 图片、音频、视频、大文件必须考虑占位、加载失败、缓存和内存风险。
- 页面需要考虑安全区、键盘遮挡、小屏适配和返回路径。

## 验证要求

- Flutter 关键路径必须有 widget test 或 integration test。
- ViewModel / Use Case 中的核心业务逻辑应优先单测。
- Repository 可以使用 fake/mock service 测试。
- 后端 API、权限边界、错误响应和性能风险使用目标项目自己的验证命令记录在 Feature 文档中。

## 默认验证命令

```bash
flutter analyze
flutter test
```
