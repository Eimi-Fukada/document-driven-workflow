# Readiness Review

这份文档用于判断 Feature 是否已经足够清楚，可以交给用户做最终批准。

## Basic Info

- Feature name:
- Related requirements:
- Created at:

## Confirmed Items

已经确认且可以进入计划的内容：

-

## Open Questions

仍需用户回答的问题。存在必须回答的问题时，不能进入开发：

-

## Blocking Issues

会阻止实现或测试的事项：

-

## Key Assumptions

AI 做出的关键假设。用户批准前必须可见：

-

## Impact Scope

影响到的页面、模块、API、数据、权限、测试或部署：

-

## Performance Review

- Performance risk: yes / no / not-applicable
- Risk trigger:
- Required mitigation:
- Verification required:

如果性能风险为 `yes`，必须在 `03-technical-contract.md` 和 `06-implementation-plan.md` 中说明方案，并在验证报告中记录证据。

## Option Review

- Multiple implementation options: yes / no
- Recommended option:
- Rejected options and reason:
- User decision required: yes / no

当方案差异会影响成本、维护性、性能、上线风险或技术栈选择时，必须给用户选择。

## Closure Review

- Closure risk: yes / no
- Missing loop:
- Possible downstream impact:
- User warning needed: yes / no
- Document update required:

如果用户当前思路可能不闭环，或改动会导致其他模块不闭环，不能直接进入实现，应先提示并补全文档。

## AI Review Conclusion

说明文档是否已经可以交给用户决策。

唯一机器可读状态是 `00-workflow.yaml`。
