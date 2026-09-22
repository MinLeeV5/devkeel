<!--
按实际需要保留 ADDED / MODIFIED / REMOVED / RENAMED section。

格式硬规则（OpenSpec 会 validate）：
- Requirement 语句必须含 `SHALL` 或 `MUST`
- 每个 Requirement 必须至少有一个 `#### Scenario:`
- Scenario 必须使用 level-4 (`####`)

内容规则：
- 需求文本、场景、条件和预期结果使用中文
- 结构关键字保留英文：ADDED/MODIFIED/REMOVED/RENAMED、SHALL/MUST、WHEN/THEN
- Requirement 和 Scenario 的名称使用中文
-->

## ADDED Requirements

### Requirement: <!-- 需求名称（中文） -->
<!-- 需求描述 — 须含 SHALL 或 MUST，其余内容使用中文 -->

**来源**: <!-- [D-03](../../brainstorm.md#d-03)；可列多个已确认决定 -->

#### Scenario: <!-- 场景名称（中文） -->
- **WHEN** <!-- 触发条件 -->
- **THEN** <!-- 预期结果 -->

---

## MODIFIED Requirements

<!--
Header 必须与主 spec 的 normalized header 完全相同（trim 后 case-sensitive）。
正文必须包含修改后的完整 Requirement，不能只写 diff。
-->

### Requirement: <!-- 与已有 spec 中相同的 header -->
<!-- 修改后的完整需求描述 — 含 SHALL 或 MUST，其余内容使用中文 -->

**来源**: <!-- [D-03](../../brainstorm.md#d-03)；可列多个已确认决定 -->

#### Scenario: <!-- 场景名称（可新增、可修改） -->
- **WHEN** <!-- 触发条件 -->
- **THEN** <!-- 预期结果 -->

---

## REMOVED Requirements

<!--
Reason 与 Migration 必填。
-->

### Requirement: <!-- 要删除的 header，与已有 spec 完全相同 -->

**来源**: <!-- [D-03](../../brainstorm.md#d-03) -->

**Reason**: <!-- 废除原因 -->

**Migration**: <!-- 已有调用方/依赖方应如何调整 -->

---

## RENAMED Requirements

<!--
使用固定的 FROM / TO 格式。名称和内容同时变更时，还要在 MODIFIED 中用新 header
写出完整 Requirement。
-->

- FROM: `### Requirement: <旧名称>`
- TO: `### Requirement: <新名称>`
- 来源: <!-- [D-03](../../brainstorm.md#d-03) -->
