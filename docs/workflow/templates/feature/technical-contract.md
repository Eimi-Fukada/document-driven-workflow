# Technical Contract 模板

## 基本信息

- 功能名称：
- Stack Preset: unset
- Project Mode: greenfield
- Exception Reason: none
- Legacy Baseline: none
- Compatibility Contract: none
- 关联需求 ID：

允许的 Stack Preset：

- `next-fullstack`
- `flutter-fastapi`
- `flutter-express`
- `legacy-existing`

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
