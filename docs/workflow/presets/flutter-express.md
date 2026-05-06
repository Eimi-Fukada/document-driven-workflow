# Stack Preset: flutter-express

## 适用场景

- 已有 Node.js / Express 后端资产
- 团队希望后端继续使用 TypeScript
- 需要复用现有 Node SDK、中间件、登录或支付能力

## 固定技术栈

- Flutter stable
- Dart
- Riverpod
- go_router
- dio
- Express 5
- TypeScript
- Zod
- PostgreSQL
- Prisma
- Vitest
- Supertest
- Docker

## 强制规则

- 这是例外预设，新项目不默认使用。
- 必须填写 Exception Reason。
- Express 后端必须使用 TypeScript。
- API 入参和返回必须有 schema 校验。

## 默认验证命令

```bash
flutter analyze
flutter test
npm run typecheck
npm run test
npm run build
docker build .
```

