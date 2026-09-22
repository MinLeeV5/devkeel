# verify-init skill 实现计划

> **给 agentic 执行器：** 按 schema apply instruction 使用
> subagent-driven-development 逐任务实现本计划。

**目标：** 新增 `verify-init` skill，扫描项目领域与技术栈，增量补齐测试脚手架 + 生成 testing 规范 + 生成验证 agent。

**架构：** 纯模板资产新增（templates/skills/verify-init/），不涉及 src/ 代码或命令注册。SKILL.md 编排 4 阶段流程，references 按检测/映射/增强/配方/产出五层组织，产物落到目标项目的项目根 + .harness/。

**技术栈：** Markdown skill 资产 + YAML frontmatter；versions-yml.yml 注册版本。

---

## 1. 骨架与检测层

- [x] **1.1 创建 SKILL.md 主流程编排**
  1. 写 `templates/skills/verify-init/SKILL.md`：YAML 头（name/description/metadata.author=devkeel/version=1.0.0/triggers）
  2. 正文：Read First（5 references）、何时使用/不使用、Hard Rules（先检测禁跳过/增量补齐幂等/补齐前用户同意/fetch 失败降级不阻塞/规范与 R4 互补/格式遵循 output-formats）、4 阶段流程总览
  3. Phase 1-5 各阶段细化（检测→确认门禁→脚手架幂等→规范+agent→收尾报告）
  4. 通勤能力沉淀段（参考 domain-init 末尾）
  > test: grep -c "Phase" templates/skills/verify-init/SKILL.md（≥5）
  > commit: feat(skills): 新增 verify-init 骨架与流程编排

- [x] **1.2 写 detection-signals.md 检测信号表**
  1. 写 `references/detection-signals.md`：领域检测信号（复用 domain-init 思路，按前端/后端/移动端/CLI/库/Monorepo 分组）+ 框架已存在检测信号（依赖/config/lockfile/目录痕迹）+ 未命中降级 + 可用领域标签
  > test: grep -E "vitest|playwright|pytest|jest" templates/skills/verify-init/references/detection-signals.md
  > commit: feat(skills): verify-init 检测信号表

- [x] **1.3 写 stack-matrix.md 映射表**
  1. 写 `references/stack-matrix.md`：4 大类 × 17 技术栈的「信号→领域→单测→e2e/API」映射表 + 未命中 custom 降级说明
  > test: grep -c "frontend-\|backend-\|react-native\|cli-\|library-" templates/skills/verify-init/references/stack-matrix.md（≥15）
  > commit: feat(skills): verify-init 技术栈映射矩阵

## 2. 增强层与产出层

- [x] **2.1 写 frameworks-index.md 框架对照表**
  1. 写 `references/frameworks-index.md`：覆盖 stack-matrix 全部框架（vitest/playwright/RTL/@vue/test-utils/pytest/supertest/testify/httptest/JUnit5/Mockito/MockMvc/jest/Detox/flutter test/XCTest/Espresso/execa/assert_cmd 等）
  2. 列：框架 / 官方文档 URL / 配置参考路径 / 最佳实践出处 / fetch 策略（context7: <id> → WebFetch <url> 降级）
  3. subAgent 使用方式 + fetch 失败降级说明（参考 domain-init/project-index.md 结构）
  > test: grep -c "context7\|WebFetch" templates/skills/verify-init/references/frameworks-index.md（≥10）
  > commit: feat(skills): verify-init 框架对照表与 fetch 策略

- [x] **2.2 写 output-formats.md 产出格式规范**
  1. 写 `references/output-formats.md`：testing 规范格式（YAML 头 description/globs + 9 章节：金字塔比例/目录组织/命名/断言/mock 边界/覆盖率门槛/执行约定/独立性/失败可诊断）+ test-verifier agent 格式（YAML 头 name/description/model + 角色定义/强制启动步骤/执行维度/输出规则/何时不调用/与 test-case-designer 衔接）+ 质量标准表
  > test: grep -E "testing\.md|test-verifier" templates/skills/verify-init/references/output-formats.md
  > commit: feat(skills): verify-init 产出格式规范

## 3. 前端 stack-recipes（4 配方）

- [x] **3.1 frontend-react.md 配方**
  1. 写 `references/stack-recipes/frontend-react.md`：安装命令（pnpm add -D vitest @testing-library/react jsdom @playwright/test）+ vitest.config.ts 内容 + playwright.config.ts 内容 + 示例（tests/example.test.ts + e2e/smoke.spec.ts）+ package.json scripts 片段
  > test: grep -E "vitest|@testing-library/react|playwright" templates/skills/verify-init/references/stack-recipes/frontend-react.md
  > commit: feat(skills): verify-init 前端 react 配方

- [x] **3.2 frontend-vue / frontend-angular / frontend-svelte 配方**
  1. 写 3 个配方文件，各含安装+config+示例+scripts，按框架特性调整（vue 用 @vue/test-utils、angular 用 Angular test bed、svelte 用 @testing-library/svelte）
  > test: ls templates/skills/verify-init/references/stack-recipes/ | grep -c "frontend-"
  > commit: feat(skills): verify-init 前端 vue/angular/svelte 配方

## 4. 后端 stack-recipes（4 配方）

- [x] **4.1 backend-node.md 配方**
  1. 写 `references/stack-recipes/backend-node.md`：vitest + supertest，安装/vitest.config/示例（tests/api.test.ts 用 supertest 调 app）/scripts
  > test: grep -E "supertest|vitest" templates/skills/verify-init/references/stack-recipes/backend-node.md
  > commit: feat(skills): verify-init 后端 node 配方

- [x] **4.2 backend-python / backend-go / backend-java-spring 配方**
  1. 写 3 个配方：python（pytest + httpx，conftest.py/pytest.ini/示例）、go（testing + testify + httptest，示例 _test.go）、java-spring（JUnit5 + Mockito + MockMvc，pom 依赖/示例）
  > test: ls templates/skills/verify-init/references/stack-recipes/ | grep -c "backend-"
  > commit: feat(skills): verify-init 后端 python/go/java-spring 配方

## 5. 移动端 stack-recipes（4 配方）

- [x] **5.1 移动端 4 配方**
  1. 写 react-native（jest + @testing-library/react-native + Detox）、flutter（flutter test + integration_test）、ios-swift（XCTest + XCUITest）、android（JUnit4 + Robolectric + Espresso）4 个配方，各含安装/配置/示例
  > test: ls templates/skills/verify-init/references/stack-recipes/ | grep -cE "react-native|flutter|ios-swift|android"
  > commit: feat(skills): verify-init 移动端 4 配方

## 6. CLI/库 stack-recipes（6 配方）

- [x] **6.1 CLI 3 配方**
  1. 写 cli-node（vitest + execa 跑真实 bin）、cli-rust（cargo test + assert_cmd）、cli-go（testing + testify + 黄金文件对比）3 个配方
  > test: ls templates/skills/verify-init/references/stack-recipes/ | grep -c "cli-"
  > commit: feat(skills): verify-init CLI 3 配方

- [x] **6.2 库 2 配方**
  1. 写 library-node（vitest 纯单测）、library-python（pytest 纯单测）2 个配方，无 e2e/API 段
  > test: ls templates/skills/verify-init/references/stack-recipes/ | grep -c "library-"
  > commit: feat(skills): verify-init 库 2 配方

## 7. 版本注册与验证

- [x] **7.1 注册版本到 versions-yml.yml**
  1. 在 `templates/versions-yml.yml` 的 `skills:` 下新增 `verify-init: "1.0.0"`
  2. 确认与 SKILL.md metadata.version 一致（skill-versioning 规范）
  > test: grep "verify-init" templates/versions-yml.yml
  > commit: chore(harness): 注册 verify-init 版本 1.0.0

- [x] **7.2 同步到 .harness/skills/ 并端到端验证**
  1. 复制 templates/skills/verify-init/ 到 .harness/skills/verify-init/（保持与现有 skills 同步）
  2. 验证文件结构完整：SKILL.md + 5 references + 17 stack-recipes
  3. lint：pnpm lint（类型检查，确认无破坏）
  4. 抽查 1 个配方端到端：frontend-react 配方内容可读、命令完整、config 合法
  > test: find templates/skills/verify-init -name "*.md" | wc -l（≥22：1 SKILL + 4 顶层 references + 17 recipes）
  > commit: chore(harness): 同步 verify-init 到 .harness/skills

- [x] **7.3 收尾质量检查**
  1. pnpm test（确认现有测试套件不受影响）
  2. 确认 SKILL.md description 含触发词
  3. 确认所有 references 在 SKILL.md Read First 列出
  > test: pnpm test
  > commit: test(skills): verify-init 收尾验证
