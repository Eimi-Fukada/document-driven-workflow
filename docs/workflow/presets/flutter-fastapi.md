# Stack Preset: flutter-fastapi

## 适用场景

- iOS / Android App
- Flutter 多端客户端
- 需要独立 API 后端
- 需要清晰 OpenAPI 契约

## 固定技术栈

- Flutter stable
- Dart
- Riverpod
- go_router
- dio
- flutter_test
- integration_test
- FastAPI
- Pydantic
- SQLAlchemy 2 或 SQLModel，项目级 ADR 固定其一
- Alembic
- PostgreSQL
- pytest
- Docker

## 强制规则

- API 契约以 FastAPI OpenAPI 和 Pydantic 模型为准。
- Flutter 客户端不能绕过 API 契约直接依赖数据库。
- 后端必须有 pytest 覆盖核心 API。
- 移动端关键路径必须有 widget test 或 integration test。

## 默认验证命令

```bash
flutter analyze
flutter test
pytest
docker build .
```

