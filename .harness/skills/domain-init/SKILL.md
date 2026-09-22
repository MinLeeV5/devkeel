---
name: domain-init
description: >-
  对项目进行全盘扫描，识别领域类型和技术栈，通过多 subAgent 并行扫描多维度，
  生成项目专属的 rules、skills 和 agents。使用「自动 baseline + 交互式增强」
  的分层模式，结合头脑风暴先扩散后收拢。
  触发词：domain-init、领域初始化、生成领域规范、领域扫描
metadata:
  author: "devkeel"
  version: "1.2.2"
---

# Domain Init — 项目领域能力生成器

扫描当前项目 → 识别领域 → 分层生成专属 rules + skills + agents。

**与 devkeel init 的关系：**

- `devkeel init` 分发「通用领域模板」— `templates/domain/<type>/` 里有什么给什么
- `domain-init` 生成「项目专属领域能力」— 基于当前项目代码扫描后定制

**产出位置：** `.harness/rules/`、`.harness/skills/`、`.harness/agents/`

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
- **含 git submodule 的主仓库** — 应在各子模块内分别运行，主仓库用 `sync-submodule-skills.mjs` 汇聚

## Hard Rules

1. **必须先完成领域检测**（Phase 1），禁止跳过直接生成
2. **Baseline 基于实际扫描** — 采样真实代码，不凭假设生成通用模板话术
3. **覆盖增强策略** — 已存在的同名 rule/skill/agent 合并项目特征，不丢失已有内容
4. **用户 review 门禁** — 所有生成内容必须经用户 review 后才写入文件系统
5. **参考项目标杆** — 每个维度的 subAgent 在生成前，先用当前可用的页面读取能力获取对应开源参考项目（见 `references/project-index.md`）
6. **领域适用性过滤** — 不同领域生成不同维度组合（见 `references/domain-matrix.md`），不输出领域无关的内容
7. **格式严格遵循** — rules/skills/agents 各自遵循 harness 标准格式（见 `references/output-formats.md`）
8. **代码依据** — 每条 rule 的约定必须能在项目代码中找到实际依据

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

读取 `references/detection-signals.md`，按信号表扫描项目根目录，推断领域和技术栈。

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

| ID | 维度 | 产出 | subAgent 职责 |
|----|------|------|--------------|
| R1 | 编码规范 | rule | 扫描代码风格、格式化配置、lint 规则、导入习惯 |
| R4 | 测试策略 | rule | 扫描测试框架、覆盖模式、测试文件组织、mock 策略 |
| R5 | 错误处理 | rule | 扫描异常模式、日志使用、错误边界、重试策略 |
| R6 | 命名规范 | rule | 扫描文件名、变量名、组件名、常量命名模式 |
| R14 | 依赖管理 | rule | 扫描依赖策略、锁文件、版本范围、准入标准 |
| R16 | 编码哲学 | rule | 提炼团队的 anti-pattern、YAGNI、代码密度惯例 |
| R17 | Git 工作流 | rule | 扫描分支策略、commit 消息格式、PR/MR 流程 |
| R20 | 编辑纪律 | rule | 基于 surgical changes 原则：只改相关代码 |
| A1 | 领域 Code Reviewer | agent | 基于以上扫描结果生成专属审查维度和输出规则 |

### 2.2 用户选择与优先级确认

**在扫描前，必须先让用户确认 baseline 范围和优先级。**

展示 baseline 候选列表，用户可以：

1. **勾选/取消** — 选择需要生成的维度，取消不需要的
2. **调整优先级** — 标记为 `高优先` / `正常` / `低优先`
3. **补充上下文** — 对特定维度补充说明（如「测试策略重点关注集成测试」）

优先级影响：
- **高优先** — 采样 15-20 个文件，生成 5+ 条约定，每条带详细示例
- **正常** — 采样 10-15 个文件，生成 3-5 条约定
- **低优先** — 采样 5-10 个文件，生成核心约定

用户确认后才进入扫描阶段。

### 2.3 subAgent 扫描方法

每个 subAgent 按以下步骤工作：

1. **Fetch 参考标杆** — 按 `references/project-index.md` 读取对应开源项目的关键文件
2. **采样代码** — 从项目中选取代表性文件（数量由优先级决定）
3. **提取模式** — 识别实际代码中的约定（不是理论最佳实践）
4. **标记不一致** — 发现团队内部不统一的地方，在 rule 中明确推荐方向
5. **对比已有产物** — 与 `.harness/` 已有 rules/agents 对比，标记需增强的部分
6. **生成产物** — 按 `references/output-formats.md` 格式规范生成

### 2.4 Baseline Review

汇总扫描结果，用户逐条 review：
- **确认** — 直接写入
- **修改** — 调整约定内容后写入
- **跳过** — 本次不生成，可在后续重新运行时生成

全部 review 完成后批量写入 `.harness/`。

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
- 确认后写入 `.harness/`

---

## Phase 4: 收尾

### 4.1 更新配置

- 更新 `.harness/config.yml` 中的领域信息（如有）
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

### 4.5 增强 AGENTS.md

domain-init 完成后，检测并增强项目 AGENTS.md，确保 Agent 能发现所有可用的 rules、skills 和 agents。

**检测与补建路由表：**

1. 读取项目根目录的 `AGENTS.md`
2. 读取 `harness:user:routing` 用户槽位，判断路由表是否已存在
3. 如果槽位为空：
   - 扫描 `.harness/rules/` 下所有 `.md` 文件，提取文件名和首行标题作为描述
   - 扫描 `.harness/skills/` 下所有目录，读取 `SKILL.md` 的 `description` 字段
   - 扫描 `.harness/agents/` 下所有 `.md` 文件
   - 生成最小触发矩阵，写入 `harness:user:routing` 用户槽位
4. 如果已存在：检查是否需要更新（新生成的 rules/skills 未出现在路由表中），提示用户确认更新

**增强项目上下文：**

检查以下用户槽位，如果为空则生成内容：

| 用户槽位 | 内容 | 来源 |
|------|------|------|
| `harness:user:domain` | 子项目职责、技术栈与边界 | Phase 1 领域检测结果 + 用户确认 |
| `harness:user:verification` | 常用命令与验证基线 | `package.json` scripts 扫描 |
| `harness:user:project` | 其他关键约束 | 包管理器检测、知识层位置等 |

**生成格式：**

```markdown
<!-- harness:user:domain -->
本子项目承载 XXX，覆盖 YYY 相关能力，技术栈以 ZZZ 为主。
<!-- /harness:user:domain -->
```

```markdown
<!-- harness:user:verification -->
### 命令

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm test` | 运行测试 |
| `pnpm lint` | 代码检查 |
<!-- /harness:user:verification -->
```

```markdown
<!-- harness:user:project -->
### 约束

- 包管理器必须使用 pnpm
- `.harness/` 是 agent 知识层
- 所有知识产出应写入 DevKeel 主仓库的 `openspec/` 目录
<!-- /harness:user:project -->
```

**写入策略：**

- 所有增强内容生成后，统一展示给用户 review
- 用户可逐段确认、修改或跳过
- 确认后写入 AGENTS.md
- 已有内容的标记区块不会被覆盖（幂等）

---

## 通用能力沉淀

在 Phase 3 交互中，如果发现某个生成的 rule/skill/agent 具有跨项目通用性：

- 标记为「候选通用能力」
- 建议用户后续 PR 到 devkeel 的 `templates/domain/<type>/`
- **不自动操作**，只做建议
