### Requirement: dual-mode-skill

test-case-designer skill SHALL 支持两种模式：full（三阶段门禁）和 fast（一次性产出）。

#### Scenario: fast 模式一次性产出

WHEN test-case-designer 以 mode=fast 调用
THEN 一次性产出测试点（或完整测试用例，视输入充分度）
AND 不触发人工门禁
AND 执行自检 checklist 后输出

#### Scenario: full 模式三阶段门禁

WHEN test-case-designer 以 mode=full 调用
THEN 按 01-context → 02-test-points → 03-test-cases 三阶段产出
AND 每阶段需人工确认后才进入下一阶段

---

### Requirement: platform-parameter

test-case-designer skill SHALL 支持 platform 参数控制测试用例的平台侧重。

#### Scenario: frontend 模式

WHEN platform=frontend
THEN 测试用例侧重 UI 交互、组件渲染、状态切换、响应式
AND 操作步骤使用 UI 操作动词
AND 排除接口实现、数据库操作

#### Scenario: backend 模式

WHEN platform=backend
THEN 测试用例侧重接口契约、入参校验、业务逻辑、异常降级
AND 操作步骤使用接口调用描述
AND 排除 UI 表现

#### Scenario: all 模式（默认）

WHEN platform=all 或未指定
THEN 综合前端和后端维度
AND 用例标题标注 `[FE]` 或 `[BE]`

---

### Requirement: openspec-spec-mapping

test-case-designer skill SHALL 自动扫描 OpenSpec spec 文件并映射为测试用例。

#### Scenario: spec 场景全覆盖

WHEN 存在 OpenSpec spec 文件
THEN 每个 `#### Scenario` MUST 映射为至少一条测试用例
AND 该用例标注 `[spec]` 溯源标记
AND Scenario 的 WHEN 映射为前置条件+操作步骤，THEN 映射为预期结果

#### Scenario: 无 spec 文件时退化

WHEN 不存在 OpenSpec spec 文件
THEN 仅基于需求文档/对话上下文生成（退化为原有行为）

---

### Requirement: agent-interface

test-case-designer skill SHALL 支持作为 subagent 被调用。

#### Scenario: subagent 调用默认行为

WHEN test-case-designer 作为 subagent 调用
AND 未显式指定 mode
THEN 默认使用 fast 模式
AND 输入通过参数传递（brainstorm.md、explore.md 路径）
AND 产出写入调用方指定的路径

---

### Requirement: unified-coverage-model

test-case-designer skill SHALL 合并两个 skill 的覆盖模型为统一体系。

#### Scenario: 覆盖模型包含四视角

WHEN 产出测试点时
THEN 每个能力子块 MUST 经过状态、交互、异常、边界四视角检查

#### Scenario: 覆盖模型包含平台维度扫描

WHEN platform 为 frontend 或 all
THEN 额外扫描：组件渲染、交互反馈、状态切换、响应式适配、路由导航
WHEN platform 为 backend 或 all
THEN 额外扫描：接口契约、入参校验、业务逻辑、数据持久化、权限鉴权、异常降级

---

### Requirement: traceability-system

test-case-designer skill SHALL 使用统一的双层追溯体系。

#### Scenario: TP 到 TC 的追溯

WHEN 产出完整测试用例（03-test-cases.md 或 fast 模式表格）
THEN 每条测试用例 MUST 回链至少一个 TP 编号
AND TP 编号格式为 `TP-<BIG>-<SMALL>-<TYPE>-NNN`

#### Scenario: TC 到 spec 的追溯

WHEN 测试用例来源于 spec 场景
THEN 用例标题末尾 MUST 标注 `[spec]`

---

### Requirement: delete-generate-test-cases

`templates/skills/generate-test-cases/` 目录 SHALL 被完整删除，其能力已合并入 test-case-designer 2.0.0。

#### Scenario: 目录删除

WHEN 实现完成时
THEN `templates/skills/generate-test-cases/` 不存在
AND versions-yml.yml 中无 generate-test-cases 条目
