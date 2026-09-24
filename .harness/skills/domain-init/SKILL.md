---
name: domain-init
description: >-
  对项目进行全盘扫描，识别领域类型和技术栈，通过多 subAgent 并行扫描多维度，
  生成项目知识 docs 与专属 rules、skills 和 agents。使用「自动 baseline + 交互式增强」
  的分层模式，结合头脑风暴先扩散后收拢。
  触发词：domain-init、领域初始化、生成领域规范、领域扫描
metadata:
  author: "devkeel"
  version: "2.0.2"
---

# Domain Init — 项目领域能力生成器

扫描当前项目 → 识别领域与归属 → 分类维护 docs + rules + skills + agents。

**与 devkeel init 的关系：**

- `devkeel init` 建立执行入口与 `.harness/`，分发通用工作流资产
- `domain-init` 生成「项目专属领域能力」— 基于当前项目代码扫描后定制

**产出位置：** 当前项目 `docs/`、`.harness/rules/`、`.harness/skills/`、`.harness/agents/`；
`AGENTS.md` 维护入口和读取条件。资产分层遵循当前项目执行契约。

## Read First

按需加载以下参考文档：

- `references/detection-signals.md` — 领域检测信号表、降级策略、可用标签
- `references/dimension-pool.md` — 增强维度池（Rules / Skills / Agents）
- `references/project-index.md` — 参考项目索引（GitHub 地址 + 参考内容）
- `references/output-formats.md` — 产出格式规范 + 质量标准
- `references/domain-matrix.md` — 领域适用性矩阵（8 大领域 × 23 维度）

## 何时使用

- 项目已完成 `devkeel init`，需要定制领域能力
- 接手新项目，需要快速建立领域规范
- 项目技术栈升级/迁移，需要更新领域规范

何时**不**使用：
- 新项目应先 `devkeel init`

根项目、普通子项目和 git submodule 均可执行。根项目扫描自身及跨项目关系；子项目扫描自身
领域。先确认目标目录与配置归属，不因存在子模块终止，也不递归改写未获授权的子项目。

## Hard Rules

1. **必须先完成领域检测**（Phase 1），禁止跳过直接生成
2. **Baseline 基于实际扫描** — 采样真实代码，不凭假设生成通用模板话术
3. **覆盖增强策略** — 已存在的同主题 docs/rule/skill/agent 合并项目特征，不丢失已有内容
4. **用户 review 门禁** — 所有生成内容必须经用户 review 后才写入文件系统
5. **参考项目标杆** — 每个维度的 subAgent 在生成前，先用当前可用的页面读取能力获取对应开源参考项目（见 `references/project-index.md`）
6. **领域适用性过滤** — 不同领域生成不同维度组合（见 `references/domain-matrix.md`），不输出领域无关的内容
7. **格式严格遵循** — docs/rules/skills/agents 各自遵循产出格式（见 `references/output-formats.md`）
8. **代码依据** — 事实须有代码、配置或已确认约定支持；扫描发现的惯例不自动升级为硬约束
9. **知识与约束分开** — rules 保留简短执行约束；背景、原理、结构说明和详细示例写入 docs。
   按主题复用已有文档，不为每个扫描维度机械创建文件，也不按使用频率移除硬约束
10. **测试资产共用** — R4 与 verify-init 维护同一套测试规则和文档；先定位已有文件，再增量更新。
    已有 `testing-strategy.md` 等入口继续复用，不并列新建重复的 `testing.md`

## 流程总览

```
Phase 1: 领域识别        → 检测 + 用户确认
Phase 2: Baseline 生成   → 用户选择维度 → 多 subAgent 并行扫描 → 用户 review → 写入
Phase 3: 交互式增强      → 头脑风暴扩散 → 用户选择+优先级 → 并行生成 → review → 写入
Phase 4: 收尾            → 配置更新 + 链接检查 + 生成报告
```

---

## Phase 1: 领域识别

### 1.1 自动检测

先读取目标作用域的 `AGENTS.md`、相关 rules 和文档入口，定位现有 `docs/` 与配置事实源。
读取 `references/detection-signals.md`，按信号表扫描目标目录，推断领域和技术栈。
根项目识别共享配置与跨项目关系；各子项目按自己的 manifest、代码和已有文档识别，不用主包
技术栈代替所有子项目。OpenSpec 任务和当前规范继续位于主仓库。

检测按优先级从高到低匹配，命中第一个即停止。覆盖：前端、后端、移动端、系统/底层、工具/库/平台、Monorepo。

如果所有信号都未命中，执行降级流程（文件后缀分布 → 入口特征 → README 描述 → 综合推断 → 用户确认）。

### 1.2 用户确认与补充

展示检测结果，用户确认或纠正。同时收集：

- **领域确认** — 检测结果是否准确？用户可手动指定领域标签
- 团队编码风格偏好（严格/宽松）
- 特殊架构约束（微服务/Monorepo/Monolith）
- 关键业务领域（金融/医疗/电商/教育等 — 影响安全和合规维度权重）
- 已有的团队规范文档（可导入为初始输入）

---

## Phase 2: Baseline 自动生成

### 2.1 Baseline 维度候选

| ID | 维度 | 候选产出 | subAgent 职责 |
|----|------|------|--------------|
| R1 | 编码规范 | rule / docs | 扫描代码风格、格式化配置、lint 规则、导入习惯 |
| R4 | 测试策略 | rule / docs | 扫描测试框架、覆盖模式、测试文件组织、mock 策略 |
| R5 | 错误处理 | rule / docs | 扫描异常模式、日志使用、错误边界、重试策略 |
| R6 | 命名规范 | rule / docs | 扫描文件名、变量名、组件名、常量命名模式 |
| R14 | 依赖管理 | rule / docs | 扫描依赖策略、锁文件、版本范围、准入标准 |
| R16 | 编码哲学 | rule / docs | 提炼团队的 anti-pattern、YAGNI、代码密度惯例 |
| R17 | Git 工作流 | rule / docs | 扫描分支策略、commit 消息格式、PR/MR 流程 |
| R20 | 编辑纪律 | rule / docs | 基于 surgical changes 原则：只改相关代码 |
| A1 | 领域 Code Reviewer | agent | 基于以上扫描结果生成专属审查维度和输出规则 |

### 2.2 用户选择与优先级确认

**在扫描前，必须先让用户确认 baseline 范围和优先级。**

展示 baseline 候选列表，用户可以：

1. **勾选/取消** — 选择需要生成的维度，取消不需要的
2. **调整优先级** — 标记为 `高优先` / `正常` / `低优先`
3. **补充上下文** — 对特定维度补充说明（如「测试策略重点关注集成测试」）

优先级影响：
- **高优先** — 深入采样关键路径、边界和例外
- **正常** — 覆盖代表性模块及其配置
- **低优先** — 仅核对核心事实与约束

优先级决定调查深度，不规定约定数量、篇幅或示例配额。

用户确认后才进入扫描阶段。

### 2.3 subAgent 扫描方法

每个 subAgent 按以下步骤工作：

1. **Fetch 参考标杆** — 按 `references/project-index.md` 读取对应开源项目的关键文件
2. **采样代码** — 从项目中选取代表性文件（数量由优先级决定）
3. **提取模式** — 识别实际代码中的约定（不是理论最佳实践）
4. **标记不一致** — 将冲突和建议提交 review，不把建议写成已生效约束
5. **对比已有产物** — 按主题定位 `docs/`、rules、skills、agents，复用已有文件与事实源
6. **分类生成** — 执行约束进入 rules；背景与示例进入 docs；可复用流程进入 skills；
   角色职责进入 agents。按 `references/output-formats.md` 生成，并列出目标文件、依据和引用

### 2.4 Baseline Review

汇总扫描结果，用户逐条 review：
- **确认** — 直接写入
- **修改** — 调整约定内容后写入
- **跳过** — 本次不生成，可在后续重新运行时生成

全部 review 完成后，按确认范围写入 `docs/` 与 `.harness/`，再更新 AGENTS 文档入口。

---

## Phase 3: 交互式增强（头脑风暴）

### 3.1 维度池展示

读取 `references/dimension-pool.md` 和 `references/domain-matrix.md`，基于 Phase 1 识别的领域
过滤不适用维度，再按 Rules / Skills / Agents 三类展示可选增强项。

### 3.2 头脑风暴：扩散

1. 向用户展示过滤后的维度池
2. 用户选择感兴趣的方向
3. 对选中维度做简短讨论：「项目里这个维度的痛点是什么？」
4. 用户可补充自定义维度（不在池中的）
5. 发散阶段不限制数量

### 3.3 收拢：用户选择与优先级确认

**在生成前，必须让用户明确选择要生成的增强项并设定优先级。**

整理发散阶段讨论的所有候选项，向用户展示选择面板（按 Rules / Skills / Agents / 自定义分组），用户可以：

- 勾选/取消任何维度
- 调整优先级（高/正常/低）
- 对特定维度补充范围说明（如「安全规范重点关注 XSS」）

确认规则：
- 必须用户明确确认后才启动生成
- 如果用户取消了所有增强项，跳过 Phase 3.4 直接进入 Phase 4

### 3.4 增强项生成

- 按确认列表并行 subAgent 生成
- 每个 subAgent 先 fetch 参考项目 → 再扫描代码 → 最后生成
- 每项生成后展示给用户 review
- 确认后按内容归属写入 `docs/` 与 `.harness/`

---

## Phase 4: 收尾

### 4.1 更新配置

- 确认 manifest 一致性

### 4.2 平台链接检查

确认以下 symlink 正常（如适用）：

- `.claude/rules` → `.harness/rules`
- `.claude/agents` → `.harness/agents`
- `.cursor/rules` → `.harness/rules`

### 4.3 子模块 Skills 同步（含 git submodule 的项目）

**为什么需要同步？**

Claude Code / Cursor 等 Coding Agent 启动时，只扫描主仓库的 `.claude/skills/`（通过 symlink
指向 `.harness/skills/`）。子模块的 `.harness/skills/` 不在扫描范围内，生成的 skills 不会自动加载。

同步的作用是将子模块的 skills 通过 symlink 平铺到主仓库的 `.harness/skills/`，形成完整的加载链路：

```
子模块/.harness/skills/xxx/
  ↓ symlink (sync-submodule-skills.mjs)
主仓库/.harness/skills/xxx/
  ↓ symlink (devkeel init 创建)
主仓库/.claude/skills/xxx/
  ↓ 启动时自动扫描
Claude Code / Coding Agent 运行环境
```

只有完成这条链路，Agent 才能在运行时自动发现和使用子模块中的 skills。

**使用方式：**

```bash
node .harness/skills/domain-init/scripts/sync-submodule-skills.mjs --dry-run  # 预览
node .harness/skills/domain-init/scripts/sync-submodule-skills.mjs            # 执行
node .harness/skills/domain-init/scripts/sync-submodule-skills.mjs --prune    # 执行 + 清理失效链接
```

脚本自动发现所有 git submodule，无需手动配置子模块路径。

**何时使用：**
- 在子模块中运行了 domain-init 生成 skills 后
- 子模块新增/删除了 skills 后

**何时不使用：**
- 单体项目（无 submodule）
- 子模块没有 `.harness/skills/`

### 4.4 生成报告

输出本次生成的完整清单（类型、文件、状态、参考项目），标记新增 vs 增强，建议后续完善方向，提醒用户 review 后 commit。

### 4.5 更新文档与 AGENTS 入口

根项目和子项目执行同一流程：

1. 按主题增量维护已存在的项目文档；没有对应文档时再创建 `docs/` 下的必要文件。
2. 将项目背景、技术栈、模块职责、开发说明写入 docs；测试知识与 verify-init 共用已有测试文档，
   缺失时使用 `docs/testing.md`。命令、门槛和参数引用实际配置或 scripts，不维护第二份值。
3. 更新 AGENTS 的文档链接与读取条件，规则和能力通过最小触发矩阵发现；不要求全量读取 docs。
4. 填充完成后删除该槽位成对的 `<!-- harness:user:... -->` / `<!-- /harness:user:... -->`
   边界注释与已用完的占位提示，保留正文及相邻框架内容。未填槽位保留占位；已有正文不重加标记。
5. 核对相对链接、规则触发范围和事实来源。后续实施改变已验证的项目事实时，同步相关文档。

| 用户槽位 | 内容 |
|----------|------|
| `harness:user:routing` | 任务信号到适用 rules、skills、agents 的路由 |
| `harness:user:verification` | 开发与测试文档的链接及读取条件 |
| `harness:user:project` | 项目概览、架构、业务边界及其他文档的链接与读取条件 |

例如，只有对应文件已存在时，才在项目知识入口添加正文：

```markdown
- 判断业务归属时读取 [项目概览](docs/project.md)。
- 调整模块依赖时读取 [架构说明](docs/architecture.md)。
```

写入复用 Phase 2/3 已确认的范围；新内容与迁移差异统一展示 review。已有用户内容按差异合并，
不覆盖未知内容。项目知识入口统一使用 `project`；旧 `domain` 内容合并到 `project` 后移除旧
槽位，不重新创建。标记已清理时按对应章节更新正文，不重复追加入口；必要入口缺失时只展示
最小新增差异，保留执行契约。
迁移已有正文时，先写入目标 docs 或 rules 并核对语义与链接，再将原正文替换为引用；执行约束、
权限及失败恢复条件必须保留在可发现的执行入口。任务草案不转写为当前项目事实。

---

## 通用能力沉淀

在 Phase 3 交互中，如果发现某个生成的 rule/skill/agent 具有跨项目通用性：

- 标记为「候选通用能力」
- 建议用户后续向 devkeel 提交通用模板提案
- **不自动操作**，只做建议
