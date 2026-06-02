# Technical Contract 模板

## 基本信息

- 功能名称：
- Stack Preset: unset
- Project Mode: greenfield
- Exception Reason: none
- Legacy Baseline: none
- Compatibility Contract: none
- 关联需求 ID：

Stack Preset：

- `next-fullstack`
- `flutter-fastapi`
- `flutter-express`
- `legacy-existing`
- custom stack，例如 `java-springboot`、`go-service`、`python-service`

内置 preset 会触发专属门禁。custom stack 不触发 Next / Flutter 专属门禁，但必须在本文件、实现计划和 Context Pack 中写清框架边界、验证命令和性能规则。

## 架构选择

- 前端：
- 后端：
- 数据库：
- 缓存：
- 文件存储：
- 部署平台：

## 技术栈边界

- Next.js App Router: yes / no / not-applicable
- Next.js Pages Router: no
- 是否涉及技术升级：no / yes-with-ADR
- ADR：

## API 契约

### API-AREA-001 接口名称

- Method：
- Path：
- Auth：
- Request：

```json
{}
```

- Response：

```json
{}
```

- Error：

```json
{}
```

## 数据模型

### EntityName

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | string | yes |  |

## 性能边界

- Performance risk: yes / no / not-applicable
- Data scale assumption:
- Concurrency assumption:
- Backend risk:
- Frontend risk:
- Database risk:
- Mitigation:
- Verification method:

命中大表查询、子查询、聚合、长列表、大文件、轮询、批处理、队列、并发写入、缓存、索引、分页或虚拟滚动等场景时，不能写 `not-applicable`。

## 方案选择

当实现方案不唯一，或存在新旧技术路线差异时，列出可选方案：

| Option | 优势 | 劣势 | 风险 | 适用条件 | 结论 |
| --- | --- | --- | --- | --- | --- |
| Option A |  |  |  |  | recommended / rejected |

如果用户选择了非推荐方案，应在 ADR 或实现计划中记录原因。

## 闭环提醒

- Closure risk: yes / no
- Missing product loop:
- Missing technical loop:
- Possible side effects:
- User decision needed:
- Suggested update:

当需求缺少入口、出口、状态流转、异常处理、权限、日志、回滚、部署、验证条件或会影响其他模块时，必须写出提醒。

## 权限

- 可访问角色：
- 可修改角色：
- 禁止访问角色：

## 环境变量

| 名称 | 环境 | 是否必填 | 说明 |
| --- | --- | --- | --- |
|  | local / preview / production | yes / no |  |

## 部署约束

- 构建命令：
- 启动命令：
- 迁移命令：
- 回滚方式：
