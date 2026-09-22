---
description: Skill 版本管理规范 — 约束 templates/ 下所有 skill、agent、rule、schema 的版本一致性
globs:
  - templates/skills/**/SKILL.md
  - templates/versions-yml.yml
  - templates/agents/**/*.md
  - templates/rules/**/*.md
  - templates/openspec/schemas/**/schema.yaml
version: 1.0.0
---

# Skill 版本管理规范

## Single Source of Truth

`templates/versions-yml.yml` 是所有模板资产版本的唯一权威来源。

```
templates/versions-yml.yml    ← 权威版本
templates/skills/*/SKILL.md   ← metadata.version 必须与之一致
```

## 版本归属

| 类别 | 判定方式 | 版本格式 | 示例 |
|------|----------|----------|------|
| **自有 skill** | `metadata.author` 为 `devkeel` | semver 三段式 `"X.Y.Z"` | `"1.0.0"`, `"2.1.0"` |
| **外部 skill** | `metadata.author` 为其他值，或从外部项目嵌入 | **保留原作者风格，不做修改** | `"1.0"`, `"5.1.0"`, `1.1` |

## 格式要求（仅适用于自有 skill）

版本号使用 **semver 三段式**，带双引号：

```yaml
# ✅ 正确
version: "1.0.0"
version: "2.1.0"

# ❌ 错误（自有 skill）
version: "1.0"      # 缺 patch 段
version: 1.1        # 无引号 + 缺 patch
version: "v1.0.0"   # 不加 v 前缀
```

外部 skill 不受此格式约束，按原作者风格记录即可。

## 操作规范

### 新增自有 Skill

1. 在 `SKILL.md` 的 `metadata.version` 中写入 `"1.0.0"`
2. 在 `versions-yml.yml` 的 `skills:` 下注册同名条目和版本
3. 两处版本必须一致

### 嵌入外部 Skill

1. 在 `SKILL.md` 中保留原作者的版本号格式
2. 在 `versions-yml.yml` 中使用相同格式注册
3. 后续升级跟随上游版本风格

### 版本升级

1. 先更新 `versions-yml.yml` 中的版本号
2. 同步更新对应 `SKILL.md` 中的 `metadata.version`
3. 禁止只改一处

### 版本号语义（自有 skill）

| 变更类型 | 升级段 | 示例 |
|----------|--------|------|
| 不兼容变更（重写、流程重构） | major | 1.0.0 → 2.0.0 |
| 新增能力（新维度、新阶段） | minor | 1.0.0 → 1.1.0 |
| 修正（typo、措辞优化、格式调整） | patch | 1.0.0 → 1.0.1 |

## 版本升级触发条件

任何对 `templates/skills/`、`templates/rules/` 内容的修改（新增、删除、编辑），都必须评估是否需要升级版本号。判断标准：

| 变更性质 | 是否升版 | 示例 |
|----------|----------|------|
| 内容变更（新增能力、合并、重构流程） | 必须升版 | 合并 rules 到 skill、新增章节 |
| 纯格式调整（换行、空格、标点） | 不升版 | 修正 markdown 格式 |
| 删除资产 | 从 versions-yml.yml 移除条目 | 删除废弃 rule |

未升版的内容变更将导致用户执行 `devkeel update` 时无法检测到更新。

## 检查流程

变更涉及 `templates/skills/` 或 `templates/versions-yml.yml` 时：

```
SKILL.md 的 metadata.version 与 versions-yml.yml 一致？
  ├─ 是 → 通过
  └─ 否 → 必须修正后再提交
```

## Schema 版本管理

Schema 版本（`templates/openspec/schemas/*/schema.yaml` 中的 `version`）是**独立整数**，不走 versions-yml.yml，自身即权威。

| 规则 | 说明 |
|------|------|
| 任何内容变更（instruction、artifact 定义、apply 逻辑）| **必须 +1** |
| 纯格式调整（缩进、换行、注释）| 不升版 |
| 新增或删除 artifact | 必须 +1 |

操作：修改 `schema.yaml` 后，直接在文件顶部将 `version: N` 改为 `version: N+1`，无需同步其他文件。
